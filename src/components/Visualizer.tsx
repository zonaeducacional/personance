import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerMode } from '../types';

interface VisualizerProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  accentColor?: string;
  className?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  mode,
  isPlaying,
  accentColor = '#06b6d4',
  className = 'w-full h-24',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode === 'off') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Internal buffer size
    const bufferLength = 64;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    // Peak levels for bars
    const peaks = new Float32Array(bufferLength);

    // Aura particles
    const particles: Array<{ x: number; y: number; size: number; speedX: number; speedY: number; alpha: number }> = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * 300,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let angleRotation = 0;

    const render = () => {
      // Handle canvas resolution
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        audioEngine.getFrequencyData(freqData);
        audioEngine.getTimeDomainData(timeData);
      } else {
        // Idle gentle wave
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.max(0, freqData[i] * 0.95);
          timeData[i] = 128;
        }
      }

      if (mode === 'bars') {
        const barWidth = Math.max(2, (width / bufferLength) * 0.75);
        const gap = Math.max(1, (width - barWidth * bufferLength) / bufferLength);

        for (let i = 0; i < bufferLength; i++) {
          const val = freqData[i] / 255;
          const barHeight = Math.max(3, val * (height - 6));
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          // Decay peak
          if (val > peaks[i]) {
            peaks[i] = val;
          } else {
            peaks[i] = Math.max(0, peaks[i] - 0.015);
          }

          // Gradient
          const grad = ctx.createLinearGradient(0, height, 0, 0);
          grad.addColorStop(0, accentColor);
          grad.addColorStop(1, '#a855f7');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();

          // Peak cap
          if (peaks[i] > 0.05) {
            const peakY = height - peaks[i] * (height - 6) - 2;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, Math.max(0, peakY), barWidth, 1.5);
          }
        }
      } else if (mode === 'wave') {
        // Oscilloscope waveform
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();

        const sliceWidth = width / (bufferLength - 1);
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
      } else if (mode === 'radial') {
        // Radial circular spectrum around center
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.45;

        angleRotation += 0.005;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angleRotation);

        const radialBars = 48;
        const step = (Math.PI * 2) / radialBars;

        for (let i = 0; i < radialBars; i++) {
          const val = (freqData[i % bufferLength] / 255) * (Math.min(centerX, centerY) * 0.45);
          const rad = radius + Math.max(2, val);

          const cos = Math.cos(i * step);
          const sin = Math.sin(i * step);

          const x1 = cos * radius;
          const y1 = sin * radius;
          const x2 = cos * rad;
          const y2 = sin * rad;

          ctx.strokeStyle = i % 2 === 0 ? accentColor : '#c084fc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.fill();

        ctx.restore();
      } else if (mode === 'aura') {
        // Particle aura
        // Calculate bass energy (first 6 bins)
        let bassSum = 0;
        for (let b = 0; b < 6; b++) bassSum += freqData[b];
        const bassLevel = bassSum / (6 * 255);

        for (const p of particles) {
          p.x += p.speedX * (1 + bassLevel * 2);
          p.y += p.speedY * (1 + bassLevel * 2);

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const currentSize = p.size * (1 + bassLevel * 1.5);

          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${Math.min(0.8, p.alpha + bassLevel * 0.4)})`;
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 12;
          ctx.fill();
        }
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode, isPlaying, accentColor]);

  if (mode === 'off') return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
