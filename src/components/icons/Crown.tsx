import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export default function Crown(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 16L3 5l5.5 5L12 2l3.5 8L21 5l-2 11H5M19 19c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </SvgIcon>
  );
}