import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

export interface ProfileSetupModalProps {
  open: boolean;
  onSave: (name: string) => void;
  isLoading?: boolean;
}

export default function ProfileSetupModal({ open, onSave, isLoading }: ProfileSetupModalProps) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setNameError('Please enter your name');
      return;
    }
    onSave(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="w-[calc(100vw-24px)] max-w-sm mx-auto p-4 sm:p-6 rounded-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg sm:text-xl">Welcome!</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Please enter your name to get started with Carpool Ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="profile-name" className="text-xs sm:text-sm">Your Name</Label>
            <Input
              id="profile-name"
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="h-11 text-sm"
              autoFocus
            />
            {nameError && <p className="text-destructive text-xs">{nameError}</p>}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full h-11 text-sm font-semibold"
          >
            {isLoading ? 'Saving...' : 'Get Started'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
