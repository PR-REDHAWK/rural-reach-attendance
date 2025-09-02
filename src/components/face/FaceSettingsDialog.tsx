import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FaceSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FaceSettings;
  onUpdateSettings: (settings: FaceSettings) => void;
}

export interface FaceSettings {
  confidenceThreshold: number;
  autoMarkThreshold: number;
  hapticFeedback: boolean;
  scanInterval: number;
}

export const FaceSettingsDialog: React.FC<FaceSettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const [localSettings, setLocalSettings] = useState<FaceSettings>(settings);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Face Recognition Settings
          </DialogTitle>
          <DialogDescription>
            Configure face detection and scanning parameters
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detection Thresholds</CardTitle>
              <CardDescription>
                Adjust sensitivity for face matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Detection Confidence: {Math.round(localSettings.confidenceThreshold * 100)}%</Label>
                <Slider
                  value={[localSettings.confidenceThreshold]}
                  onValueChange={([value]) => 
                    setLocalSettings(prev => ({ ...prev, confidenceThreshold: value }))
                  }
                  min={0.2}
                  max={0.8}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more strict matching
                </p>
              </div>

              <div className="space-y-2">
                <Label>Auto-mark Threshold: {Math.round(localSettings.autoMarkThreshold * 100)}%</Label>
                <Slider
                  value={[localSettings.autoMarkThreshold]}
                  onValueChange={([value]) => 
                    setLocalSettings(prev => ({ ...prev, autoMarkThreshold: value }))
                  }
                  min={0.4}
                  max={0.9}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Confidence needed for automatic attendance marking
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Scanning Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Scan Interval: {localSettings.scanInterval}ms</Label>
                <Slider
                  value={[localSettings.scanInterval]}
                  onValueChange={([value]) => 
                    setLocalSettings(prev => ({ ...prev, scanInterval: value }))
                  }
                  min={500}
                  max={3000}
                  step={250}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How often to check for faces
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Haptic Feedback</Label>
                  <p className="text-xs text-muted-foreground">
                    Vibrate on successful match
                  </p>
                </div>
                <Switch
                  checked={localSettings.hapticFeedback}
                  onCheckedChange={(checked) =>
                    setLocalSettings(prev => ({ ...prev, hapticFeedback: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};