// Championship logos live in /public/championships, keyed by championship id.
// Championships without an entry fall back to the trophy icon.
// `scale` evens out visual weight: a logo with more empty space (CBQF's
// laurels) needs to be drawn larger to look the same size as a solid badge.
interface ChampionshipLogo {
  src: string;
  scale: number;
}

const LOGOS: Record<number, ChampionshipLogo> = {
  1: { src: '/championships/guinadas.webp', scale: 1 },
  2: { src: '/championships/cbqf.webp', scale: 1.12 },
};

export const getChampionshipLogo = (id: number): string | undefined => LOGOS[id]?.src;

export const getChampionshipLogoScale = (id: number): number => LOGOS[id]?.scale ?? 1;
