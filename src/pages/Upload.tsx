import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Upload as UploadIcon, Image, Check, X, AlertCircle } from 'lucide-react';
import { api, OCRDriver, Circuit } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DriverSelection extends OCRDriver {
  selected: boolean;
}

const UploadPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<DriverSelection[]>([]);
  const [circuitId, setCircuitId] = useState<string>('');
  const [raceDate, setRaceDate] = useState<Date>(new Date());

  const { data: circuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: () => api.getCircuits(),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadImage(file),
    onSuccess: (data) => {
      const driversWithSelection = data.drivers.map(driver => ({
        ...driver,
        selected: true,
      }));
      setDrivers(driversWithSelection);
      setStep(2);
    },
    onError: () => {
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
        .filter(d => d.selected)
        .map(({ selected, ...driver }) => driver);
      
      return api.saveRaceResults({
        circuit_id: parseInt(circuitId),
        date: format(raceDate, 'yyyy-MM-dd'),
        selected_drivers: selectedDrivers,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Success!',
        description: 'Race results saved successfully.',
      });
      navigate(`/races/${data.id}`);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save race results. Please try again.',
        variant: 'destructive',
      });
    },
  });

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

  const selectedCount = drivers.filter(d => d.selected).length;
  const canSave = selectedCount > 0 && circuitId;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">UPLOAD RACE RESULTS</h1>
        <p className="page-subtitle">Upload a race result image to extract and save driver data</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={cn(
              'text-sm hidden sm:block',
              step >= s ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {s === 1 && 'Upload Image'}
              {s === 2 && 'Review Data'}
              {s === 3 && 'Save Results'}
            </span>
            {s < 3 && <div className="w-8 h-0.5 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload Image */}
      {step === 1 && (
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer group"
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
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Image className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-medium">Click to upload race results image</p>
                <p className="text-sm text-muted-foreground mt-2">Supports JPG, JPEG, PNG</p>
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
                className="racing-gradient"
              >
                {uploadMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Extract Data
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review & Select Drivers */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {selectedCount} of {drivers.length} drivers selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Deselect All
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="racing-table">
              <thead>
                <tr>
                  <th className="w-12"></th>
                  <th>Driver Name</th>
                  <th>Laps</th>
                  <th>Fastest Lap</th>
                  <th>Average Lap</th>
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
                    <td className="lap-time text-primary">{driver.fastest_lap}</td>
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
              <label className="text-sm font-medium">Race Date</label>
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
              className="racing-gradient"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Save */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-display text-xl tracking-wider mb-4">CONFIRM RACE DETAILS</h3>
            
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

            <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
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
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="racing-gradient"
            >
              {saveMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Race Results'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
