import { SeedHistoryGroup } from '../types';

// Histórico de exemplo pré-existente (sessões anteriores), por exerciseId.
export const seedHistory: Record<string, SeedHistoryGroup[]> = {
  pulldown: [
    {
      date: 'Sáb., 31.10.2020',
      rows: [
        { n: 'Nº4', label: '55 kg x 12 repetições', time: '09:14' },
        { n: 'Nº3', label: '55 kg x 12 repetições', time: '09:11' },
        { n: 'Nº2', label: '50 kg x 12 repetições', time: '09:08' },
        { n: 'Nº1', label: '50 kg x 12 repetições', time: '09:05' },
      ],
    },
    {
      date: 'Qua., 28.10.2020',
      rows: [
        { n: 'Nº3', label: '50 kg x 12 repetições', time: '19:42' },
        { n: 'Nº2', label: '50 kg x 11 repetições', time: '19:39' },
        { n: 'Nº1', label: '45 kg x 12 repetições', time: '19:36' },
      ],
    },
  ],
};
