import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Upload as UploadIcon, Image, Check, X, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp, ZoomIn } from 'lucide-react';
import { api, OCRDriver, Lap, AuthError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/racing/PageHeader';

interface DriverSelection extends OCRDriver {
  selected: boolean;
}

// Route protection hook
const useRequireAuth = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login', {
        state: { message: 'You need to login first to upload a new race' },
        replace: true
      });
    }
  }, [isLoggedIn, isLoading, navigate]);

  return { isLoggedIn, isLoading };
};

// Convert "0:36.195" to seconds (36.195)
const timeToSeconds = (timeString: string | null): number | null => {
  if (!timeString || timeString === null) {
    return null;
  }
  const parts = timeString.split(':');
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0]);
  const seconds = parseFloat(parts[1]);
  if (isNaN(minutes) || isNaN(seconds)) return null;
  return minutes * 60 + seconds;
};

// Convert seconds (36.195) back to "0:36.195"
const secondsToTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

// Validate lap time format (M:SS.mmm)
const isValidLapTimeFormat = (timeString: string): boolean => {
  if (!timeString || timeString.trim() === '') return true; // Empty is allowed (null lap)
  const regex = /^\d+:\d{2}\.\d{3}$/;
  return regex.test(timeString);
};

// Recalculate fastest and average lap from individual laps
const recalculateDriverTimes = (driver: OCRDriver): OCRDriver => {
  if (!driver.laps || driver.laps.length === 0) {
    return driver;
  }

  // Calculate fastest lap (only from valid non-null times)
  let fastestLapTime: string | null = null;
  let fastestSeconds = Infinity;

  driver.laps.forEach(lap => {
    if (lap.lap_time) {
      const lapSeconds = timeToSeconds(lap.lap_time);
      if (lapSeconds !== null && lapSeconds < fastestSeconds) {
        fastestSeconds = lapSeconds;
        fastestLapTime = lap.lap_time;
      }
    }
  });

  // Calculate average lap (only from valid non-null times)
  let totalSeconds = 0;
  let validLaps = 0;

  driver.laps.forEach(lap => {
    if (lap.lap_time) {
      const lapSeconds = timeToSeconds(lap.lap_time);
      if (lapSeconds !== null) {
        totalSeconds += lapSeconds;
        validLaps++;
      }
    }
  });

  const averageLap = validLaps > 0 ? secondsToTime(totalSeconds / validLaps) : null;

  return {
    ...driver,
    fastest_lap: fastestLapTime || driver.fastest_lap,
    average_lap: averageLap || driver.average_lap,
  };
};

const STEPS = ['Upload photo', 'Pick drivers', 'Check laps', 'Save'];

const UploadPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Route protection - redirect if not logged in
  const { isLoggedIn, isLoading: authLoading } = useRequireAuth();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverSelection[]>([]);
  const [circuitId, setCircuitId] = useState<string>('');
  const [raceDate, setRaceDate] = useState<Date>(new Date());
  const [imageExpanded, setImageExpanded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<number, string>>>({});

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadImage(file),
    onSuccess: (data) => {
      // Recalculate fastest_lap and average_lap from individual laps (OCR values can be wrong)
      const driversWithSelection = data.drivers.map(driver => ({
        ...recalculateDriverTimes(driver),
        selected: true,
      }));
      setDrivers(driversWithSelection);
      setStep(2);
    },
    onError: (error) => {
      if (error instanceof AuthError) {
        navigate('/login', { state: { message: error.message } });
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to process image. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const selectedDrivers = drivers
        .filter(d => d.selected === true)
        .map(({ selected, ...driver }) => ({
          ...driver,
          // Filter out completely empty laps at the end, keep nulls in the middle
          laps: driver.laps.map(lap => ({
            ...lap,
            lap_time: lap.lap_time?.trim() || null,
          })),
        }));
      
      console.log('Total drivers from OCR:', drivers.length);
      console.log('Selected drivers count:', selectedDrivers.length);
      console.log('Selected drivers:', selectedDrivers.map(d => d.name));
      console.log('Full payload:', {
        circuit_id: parseInt(circuitId),
        date: format(raceDate, 'yyyy-MM-dd'),
        selected_drivers: selectedDrivers,
      });
      
      return api.saveRaceResults({
        circuit_id: parseInt(circuitId),
        date: format(raceDate, 'yyyy-MM-dd'),
        selected_drivers: selectedDrivers,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Race saved',
        description: 'The results are now in the standings.',
      });
      navigate(`/races/${data.id}`);
    },
    onError: (error) => {
      if (error instanceof AuthError) {
        navigate('/login', { state: { message: error.message } });
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to save race results. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Don't render anything if not logged in or still checking auth
  if (authLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractData = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const toggleDriver = (index: number) => {
    setDrivers(prev => prev.map((d, i) => 
      i === index ? { ...d, selected: !d.selected } : d
    ));
  };

  const selectAll = () => {
    setDrivers(prev => prev.map(d => ({ ...d, selected: true })));
  };

  const deselectAll = () => {
    setDrivers(prev => prev.map(d => ({ ...d, selected: false })));
  };

  // Update lap time for a specific driver and lap
  const updateLapTime = (driverIndex: number, lapIndex: number, newTime: string) => {
    setDrivers(prev => prev.map((driver, dIdx) => {
      if (dIdx !== driverIndex) return driver;
      
      const newLaps = driver.laps.map((lap, lIdx) => {
        if (lIdx !== lapIndex) return lap;
        return { ...lap, lap_time: newTime };
      });
      
      return { ...recalculateDriverTimes({ ...driver, laps: newLaps }), selected: driver.selected };
    }));

    // Clear validation error if fixed
    if (isValidLapTimeFormat(newTime)) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[driverIndex.toString()]) {
          delete newErrors[driverIndex.toString()][lapIndex];
          if (Object.keys(newErrors[driverIndex.toString()]).length === 0) {
            delete newErrors[driverIndex.toString()];
          }
        }
        return newErrors;
      });
    }
  };

  // Validate lap time on blur
  const handleLapTimeBlur = (driverIndex: number, lapIndex: number, value: string) => {
    if (value && !isValidLapTimeFormat(value)) {
      setValidationErrors(prev => ({
        ...prev,
        [driverIndex.toString()]: {
          ...prev[driverIndex.toString()],
          [lapIndex]: 'Invalid format. Use M:SS.mmm (e.g., 0:36.195)',
        },
      }));
    }
  };

  // Delete a lap
  const deleteLap = (driverIndex: number, lapIndex: number) => {
    setDrivers(prev => prev.map((driver, dIdx) => {
      if (dIdx !== driverIndex) return driver;
      
      const isLastLap = lapIndex === driver.laps.length - 1;
      
      if (isLastLap) {
        // Remove the last lap completely
        const newLaps = driver.laps.filter((_, lIdx) => lIdx !== lapIndex);
        return { ...recalculateDriverTimes({ ...driver, laps: newLaps }), selected: driver.selected };
      } else {
        // Keep the lap but set time to null (middle lap deletion)
        const newLaps = driver.laps.map((l, lIdx) => {
          if (lIdx !== lapIndex) return l;
          return { ...l, lap_time: null };
        });
        return { ...recalculateDriverTimes({ ...driver, laps: newLaps }), selected: driver.selected };
      }
    }));
  };

  // Add a missing lap
  const addLap = (driverIndex: number) => {
    setDrivers(prev => prev.map((driver, dIdx) => {
      if (dIdx !== driverIndex) return driver;
      
      const nextLapNumber = driver.laps.length > 0 
        ? Math.max(...driver.laps.map(l => l.lap_number)) + 1 
        : 1;
      
      const newLaps = [...driver.laps, { lap_number: nextLapNumber, lap_time: '' }];
      return { ...driver, laps: newLaps };
    }));
  };

  const selectedCount = drivers.filter(d => d.selected).length;
  const selectedDrivers = drivers.filter(d => d.selected);
  const canSave = selectedCount > 0 && circuitId;

  // Validate all lap times before proceeding to save
  const validateAllLapTimes = (): boolean => {
    const errors: Record<string, Record<number, string>> = {};
    let hasErrors = false;

    selectedDrivers.forEach((driver, driverIndex) => {
      const originalIndex = drivers.findIndex(d => d.name === driver.name);
      driver.laps.forEach((lap, lapIndex) => {
        if (lap.lap_time && !isValidLapTimeFormat(lap.lap_time)) {
          if (!errors[originalIndex.toString()]) {
            errors[originalIndex.toString()] = {};
          }
          errors[originalIndex.toString()][lapIndex] = 'Invalid format';
          hasErrors = true;
        }
      });
    });

    setValidationErrors(errors);

    // Check at least one driver has at least one valid lap
    const hasValidLap = selectedDrivers.some(driver => 
      driver.laps.some(lap => lap.lap_time && isValidLapTimeFormat(lap.lap_time))
    );

    if (!hasValidLap) {
      toast({
        title: 'Validation Error',
        description: 'At least one driver must have at least one valid lap time.',
        variant: 'destructive',
      });
      return false;
    }

    if (hasErrors) {
      toast({
        title: 'Validation Error',
        description: 'Please fix invalid lap time formats before saving.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleProceedToConfirm = () => {
    if (validateAllLapTimes()) {
      setStep(4);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Upload a race"
        subtitle="Take a photo of the timing sheet. The laps are read automatically, then you check them before saving."
      />

      {/* Progress Steps */}
      <ol className="grid grid-cols-4 gap-1.5">
        {STEPS.map((label, i) => {
          const s = i + 1;
          return (
            <li key={label} className="space-y-2">
              <div
                className={cn(
                  'h-1.5 -skew-x-12 transition-colors',
                  step > s ? 'bg-primary' : step === s ? 'bg-primary animate-pulse' : 'bg-secondary'
                )}
              />
              <p className={cn('text-xs sm:text-sm', step >= s ? 'text-foreground' : 'text-muted-foreground')}>
                <span className="lap-time mr-1">{s}</span>
                <span className="hidden sm:inline">{label}</span>
              </p>
            </li>
          );
        })}
      </ol>

      {/* Step 1: Upload Image */}
      {step === 1 && (
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-sm p-8 md:p-12 bg-card text-center hover:border-primary/50 transition-colors cursor-pointer group"
          >
            {imagePreview ? (
              <div className="space-y-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
              </div>
            ) : (
              <>
                <Image className="w-10 h-10 text-primary mx-auto mb-4" />
                <p className="display uppercase text-2xl">Choose the timing sheet photo</p>
                <p className="text-sm text-muted-foreground mt-2">JPG or PNG</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setImagePreview(null);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button
                onClick={handleExtractData}
                disabled={uploadMutation.isPending}
               
              >
                {uploadMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Reading laps, this can take a minute…
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Read lap times
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Drivers */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {selectedCount} of {drivers.length} drivers selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Clear selection
              </Button>
            </div>
          </div>

          <div className="panel overflow-x-auto">
            <table className="racing-table">
              <thead>
                <tr>
                  <th className="w-12"></th>
                  <th>Driver</th>
                  <th>Laps</th>
                  <th>Fastest</th>
                  <th>Average</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'cursor-pointer',
                      !driver.selected && 'opacity-50'
                    )}
                    onClick={() => toggleDriver(index)}
                  >
                    <td>
                      <Checkbox
                        checked={driver.selected}
                        onCheckedChange={() => toggleDriver(index)}
                      />
                    </td>
                    <td className="font-medium">{driver.name}</td>
                    <td>{driver.laps.length}</td>
                    <td className="lap-time t-purple">{driver.fastest_lap}</td>
                    <td className="lap-time">{driver.average_lap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Circuit</label>
              <Select value={circuitId} onValueChange={setCircuitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select circuit" />
                </SelectTrigger>
                <SelectContent>
                  {circuits?.map((circuit) => (
                    <SelectItem key={circuit.id} value={circuit.id.toString()}>
                      {circuit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Race date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {format(raceDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={raceDate}
                    onSelect={(date) => date && setRaceDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!canSave}
             
            >
              Check lap times
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Validate Lap Times */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Collapsible Image Viewer */}
          <Collapsible open={imageExpanded} onOpenChange={setImageExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  {imageExpanded ? 'Hide the photo' : 'Show the photo'}
                </span>
                {imageExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {imagePreview && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Original timing sheet"
                    className="w-full h-auto max-h-[500px] object-contain bg-black/5"
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <div className="text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 inline-block mr-2" />
            Validate and correct lap times for the {selectedCount} selected driver{selectedCount !== 1 ? 's' : ''}. 
            Format: M:SS.mmm (e.g., 0:36.195)
          </div>

          {/* Driver Cards with Editable Laps */}
          <div className="space-y-6">
            {selectedDrivers.map((driver) => {
              const originalIndex = drivers.findIndex(d => d.name === driver.name);
              return (
                <div key={driver.name} className="panel overflow-hidden">
                  <div className="bg-secondary/50 p-4 border-b border-border">
                    <h4 className="display uppercase text-2xl">{driver.name}</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      {driver.laps.filter(l => l.lap_time).length} valid laps, fastest{' '}
                      <span className="lap-time t-purple">{driver.fastest_lap || 'N/A'}</span>, average{' '}
                      <span className="lap-time">{driver.average_lap || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {driver.laps.map((lap, lapIndex) => {
                        const error = validationErrors[originalIndex.toString()]?.[lapIndex];
                        return (
                          <div key={lap.lap_number} className="space-y-1">
                            <label className="text-xs text-muted-foreground">Lap {lap.lap_number}</label>
                            <div className="flex gap-1">
                              <Input
                                value={lap.lap_time || ''}
                                onChange={(e) => updateLapTime(originalIndex, lapIndex, e.target.value)}
                                onBlur={(e) => handleLapTimeBlur(originalIndex, lapIndex, e.target.value)}
                                placeholder="0:00.000"
                                className={cn(
                                  'h-9 text-sm lap-time',
                                  error && 'border-destructive focus-visible:ring-destructive',
                                  !lap.lap_time && 'text-muted-foreground bg-secondary/30'
                                )}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteLap(originalIndex, lapIndex)}
                                title={lapIndex === driver.laps.length - 1 ? 'Delete lap' : 'Clear lap time'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {error && (
                              <p className="text-xs text-destructive">{error}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => addLap(originalIndex)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add missing lap
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              onClick={handleProceedToConfirm}
             
            >
              Review and save
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm & Save */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="panel p-4 md:p-6">
            <h3 className="section-title mb-4">Confirm the race</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Circuit</span>
                <span>{circuits?.find(c => c.id.toString() === circuitId)?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Date</span>
                <span>{format(raceDate, 'PPP')}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Drivers to save</span>
                <span>{selectedCount} drivers</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-secondary/50 rounded-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Ready to save</p>
                  <p className="text-muted-foreground">
                    Only the {selectedCount} selected driver{selectedCount !== 1 ? 's' : ''} will be saved to the database.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
             
            >
              {saveMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving…
                </>
              ) : (
                'Save race'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
