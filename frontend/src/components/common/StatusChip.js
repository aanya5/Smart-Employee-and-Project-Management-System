import React from 'react';
import { Chip } from '@mui/material';

const colors = {
  PLANNING: { bg: '#E8F0F3', color: '#0B3D4A' },
  IN_PROGRESS: { bg: '#E7F0FA', color: '#1D4E89' },
  ON_HOLD: { bg: '#FEF3C7', color: '#B45309' },
  COMPLETED: { bg: '#D8F3DC', color: '#2D6A4F' },
  CANCELLED: { bg: '#F8D7DA', color: '#9B2226' },
  TODO: { bg: '#E8F0F3', color: '#0B3D4A' },
  IN_REVIEW: { bg: '#FDE8D8', color: '#C45C26' },
  BLOCKED: { bg: '#F8D7DA', color: '#9B2226' },
  LOW: { bg: '#E8F0F3', color: '#4A6066' },
  MEDIUM: { bg: '#FEF3C7', color: '#B45309' },
  HIGH: { bg: '#FDE8D8', color: '#C45C26' },
  CRITICAL: { bg: '#F8D7DA', color: '#9B2226' },
};

export default function StatusChip({ value }) {
  if (!value) return null;
  const style = colors[value] || { bg: '#E8F0F3', color: '#0B3D4A' };
  return (
    <Chip
      size="small"
      label={String(value).replace(/_/g, ' ')}
      sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, borderRadius: 1.5 }}
    />
  );
}
