'use client';

import { QRCodeSVG } from 'qrcode.react';

interface Props {
  url: string;
  size?: number;
}

export default function QrCode({ url, size = 200 }: Props) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md inline-block">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        includeMargin
        className="rounded-lg"
      />
    </div>
  );
}
