import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MeasurementField } from '@/lib/measurementTemplates';
import bodyDiagram from '@/assets/body-diagram.png';

interface BodyDiagramProps {
  measurements: Record<string, number>;
  activeField: string | null;
  onFieldSelect: (field: string) => void;
  fields: MeasurementField[];
}

// Map measurement keys to positions on the body diagram (percentages)
const measurementPositions: Record<string, { x: number; y: number; side: 'left' | 'right' }> = {
  // Upper body
  neck: { x: 50, y: 12, side: 'right' },
  shoulder: { x: 50, y: 16, side: 'left' },
  chest: { x: 50, y: 25, side: 'right' },
  bust: { x: 50, y: 25, side: 'right' },
  bustPoint: { x: 40, y: 27, side: 'left' },
  waist: { x: 50, y: 38, side: 'right' },
  hips: { x: 50, y: 48, side: 'left' },
  
  // Arms
  sleeveLength: { x: 20, y: 35, side: 'left' },
  bicep: { x: 22, y: 30, side: 'left' },
  wrist: { x: 15, y: 50, side: 'left' },
  armhole: { x: 30, y: 22, side: 'left' },
  
  // Lower body
  inseam: { x: 45, y: 70, side: 'left' },
  outseam: { x: 60, y: 65, side: 'right' },
  thigh: { x: 42, y: 55, side: 'left' },
  knee: { x: 43, y: 72, side: 'left' },
  legOpening: { x: 44, y: 88, side: 'left' },
  rise: { x: 55, y: 52, side: 'right' },
  hipDepth: { x: 58, y: 45, side: 'right' },
  
  // Lengths
  shirtLength: { x: 70, y: 35, side: 'right' },
  jacketLength: { x: 72, y: 40, side: 'right' },
  dressLength: { x: 75, y: 55, side: 'right' },
  skirtLength: { x: 68, y: 60, side: 'right' },
  blouseLength: { x: 70, y: 35, side: 'right' },
};

export function BodyDiagram({ measurements, activeField, onFieldSelect, fields }: BodyDiagramProps) {
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Body diagram image */}
      <img 
        src={bodyDiagram} 
        alt="Body measurement diagram" 
        className="w-full h-auto opacity-60"
      />
      
      {/* Measurement points */}
      {fields.map((field) => {
        const position = measurementPositions[field.key];
        if (!position) return null;
        
        const isActive = activeField === field.key;
        const isHovered = hoveredField === field.key;
        const hasValue = measurements[field.key] !== undefined && measurements[field.key] > 0;
        
        return (
          <div
            key={field.key}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            {/* Measurement point dot */}
            <button
              onClick={() => onFieldSelect(field.key)}
              onMouseEnter={() => setHoveredField(field.key)}
              onMouseLeave={() => setHoveredField(null)}
              className={cn(
                'relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200',
                isActive ? 'bg-primary scale-125 shadow-lg' : hasValue ? 'bg-success' : 'bg-muted-foreground/50',
                'hover:scale-125 hover:shadow-md cursor-pointer'
              )}
            >
              {hasValue && (
                <span className="text-[8px] font-bold text-white">✓</span>
              )}
            </button>
            
            {/* Tooltip/Label */}
            {(isActive || isHovered) && (
              <div
                className={cn(
                  'absolute z-10 whitespace-nowrap px-2 py-1 rounded-md text-xs font-medium shadow-lg animate-scale-in',
                  'bg-card border text-card-foreground',
                  position.side === 'left' ? 'right-full mr-2' : 'left-full ml-2'
                )}
              >
                <div className="font-semibold">{field.label}</div>
                {hasValue && (
                  <div className="text-primary font-bold">{measurements[field.key]}"</div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Measured</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Active</span>
        </div>
      </div>
    </div>
  );
}
