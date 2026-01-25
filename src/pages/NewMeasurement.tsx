import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BodyDiagram } from '@/components/measurements/BodyDiagram';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  ArrowLeft,
  User,
  Ruler,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { GarmentType, FitType, MeasurementUnit } from '@/types';
import { measurementTemplates, MeasurementField } from '@/lib/measurementTemplates';
import { cn } from '@/lib/utils';

// Mock customers for selection
const mockCustomers = [
  { id: '1', name: 'James Wilson', phone: '+1 234-567-8901' },
  { id: '2', name: 'Sarah Johnson', phone: '+1 234-567-8902' },
  { id: '3', name: 'Michael Brown', phone: '+1 234-567-8903' },
  { id: '4', name: 'Emily Davis', phone: '+1 234-567-8904' },
  { id: '5', name: 'David Miller', phone: '+1 234-567-8905' },
];

const garmentTypes: { type: GarmentType; label: string; icon: string }[] = [
  { type: 'SHIRT', label: 'Shirt', icon: '👔' },
  { type: 'TROUSERS', label: 'Trousers', icon: '👖' },
  { type: 'SUIT', label: 'Suit', icon: '🤵' },
  { type: 'DRESS', label: 'Dress', icon: '👗' },
  { type: 'BLOUSE', label: 'Blouse', icon: '👚' },
  { type: 'SKIRT', label: 'Skirt', icon: '🩱' },
  { type: 'JACKET', label: 'Jacket', icon: '🧥' },
];

export default function NewMeasurement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [customerId, setCustomerId] = useState('');
  const [measurementName, setMeasurementName] = useState('');
  const [garmentType, setGarmentType] = useState<GarmentType>('SHIRT');
  const [unit, setUnit] = useState<MeasurementUnit>('INCHES');
  const [fit, setFit] = useState<FitType>('REGULAR');
  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);

  const template = measurementTemplates[garmentType];
  const fields = template.fields;
  const completedCount = fields.filter(f => measurements[f.key] > 0).length;
  const progress = (completedCount / fields.length) * 100;

  useEffect(() => {
    // Reset measurements when garment type changes
    setMeasurements({});
    setCurrentFieldIndex(0);
    setActiveField(fields[0]?.key || null);
  }, [garmentType]);

  useEffect(() => {
    if (activeField && inputRefs.current[activeField]) {
      inputRefs.current[activeField]?.focus();
    }
  }, [activeField]);

  const handleFieldSelect = (fieldKey: string) => {
    setActiveField(fieldKey);
    const index = fields.findIndex(f => f.key === fieldKey);
    if (index !== -1) setCurrentFieldIndex(index);
  };

  const handleMeasurementChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMeasurements(prev => ({ ...prev, [key]: numValue }));
  };

  const handleNextField = () => {
    if (currentFieldIndex < fields.length - 1) {
      const nextIndex = currentFieldIndex + 1;
      setCurrentFieldIndex(nextIndex);
      setActiveField(fields[nextIndex].key);
    }
  };

  const handlePrevField = () => {
    if (currentFieldIndex > 0) {
      const prevIndex = currentFieldIndex - 1;
      setCurrentFieldIndex(prevIndex);
      setActiveField(fields[prevIndex].key);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldKey: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleNextField();
    }
  };

  const handleSave = () => {
    if (!customerId) {
      toast({
        title: 'Customer required',
        description: 'Please select a customer for this measurement.',
        variant: 'destructive',
      });
      return;
    }

    if (!measurementName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for this measurement.',
        variant: 'destructive',
      });
      return;
    }

    if (completedCount === 0) {
      toast({
        title: 'No measurements',
        description: 'Please enter at least one measurement.',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Save to database
    toast({
      title: 'Measurement saved!',
      description: `${measurementName} has been saved successfully.`,
    });
    navigate('/measurements');
  };

  const currentField = fields[currentFieldIndex];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/measurements')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold">New Measurement</h1>
            <p className="text-muted-foreground mt-1">
              Record body measurements for a customer
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Measurement
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Details */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex flex-col">
                          <span>{customer.name}</span>
                          <span className="text-xs text-muted-foreground">{customer.phone}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label>Measurement Name</Label>
                  <Input
                    placeholder="e.g., Business Suit, Wedding Dress"
                    value={measurementName}
                    onChange={(e) => setMeasurementName(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Garment Type Selection */}
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Garment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {garmentTypes.map((g) => (
                    <button
                      key={g.type}
                      onClick={() => setGarmentType(g.type)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border transition-all text-left',
                        garmentType === g.type
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                      )}
                    >
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-sm font-medium">{g.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Options */}
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v as MeasurementUnit)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCHES">Inches</SelectItem>
                      <SelectItem value="CENTIMETERS">Centimeters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fit Preference</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['SLIM', 'REGULAR', 'LOOSE'] as FitType[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFit(f)}
                        className={cn(
                          'py-2 px-3 rounded-lg text-sm font-medium transition-all border',
                          fit === f
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {f.charAt(0) + f.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any special notes or preferences..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Body Diagram */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Body Diagram</CardTitle>
                  <Badge variant="secondary">
                    {completedCount}/{fields.length} completed
                  </Badge>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <BodyDiagram
                  measurements={measurements}
                  activeField={activeField}
                  onFieldSelect={handleFieldSelect}
                  fields={fields}
                />
              </CardContent>
            </Card>

            {/* Current Field Input (Mobile-friendly) */}
            {currentField && (
              <Card className="shadow-soft border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrevField}
                      disabled={currentFieldIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {currentFieldIndex + 1} of {fields.length}
                      </p>
                      <h3 className="font-semibold text-lg">{currentField.label}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNextField}
                      disabled={currentFieldIndex === fields.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {currentField.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={(el) => { inputRefs.current[currentField.key] = el; }}
                      type="number"
                      step="0.25"
                      placeholder={currentField.typical ? `${currentField.typical.min}-${currentField.typical.max}` : '0'}
                      value={measurements[currentField.key] || ''}
                      onChange={(e) => handleMeasurementChange(currentField.key, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, currentField.key)}
                      className="text-center text-lg font-semibold"
                    />
                    <span className="text-muted-foreground font-medium w-12">
                      {unit === 'INCHES' ? 'in' : 'cm'}
                    </span>
                  </div>
                  {currentField.typical && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Typical range: {currentField.typical.min}-{currentField.typical.max} {unit === 'INCHES' ? 'in' : 'cm'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - All Fields List */}
          <div>
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  All Measurements
                </CardTitle>
                <CardDescription>
                  Click on any field to edit or tap on the diagram
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const value = measurements[field.key];
                    const hasValue = value !== undefined && value > 0;
                    const isActive = activeField === field.key;

                    return (
                      <button
                        key={field.key}
                        onClick={() => handleFieldSelect(field.key)}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                              hasValue
                                ? 'bg-success text-success-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {hasValue ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{field.label}</p>
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasValue ? (
                            <span className="font-semibold text-primary">
                              {value} {unit === 'INCHES' ? 'in' : 'cm'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
