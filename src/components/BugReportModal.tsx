import React, { useState } from 'react';
import { Bug, X, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useGame } from '@/contexts/GameContext';
import { toast } from 'sonner';
import { z } from 'zod';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const bugReportSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be under 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be under 2000 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

const categories = [
  { value: 'gameplay', label: '🎮 Gameplay Issue' },
  { value: 'visual', label: '🎨 Visual/UI Bug' },
  { value: 'performance', label: '⚡ Performance' },
  { value: 'account', label: '👤 Account/Login' },
  { value: 'leaderboard', label: '🏆 Leaderboard' },
  { value: 'rewards', label: '🎁 Rewards/Currency' },
  { value: 'other', label: '📝 Other' },
];

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const { user, isLoggedIn } = useGame();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = bugReportSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('bug_reports').insert({
        user_id: isLoggedIn ? user?.id : null,
        email: formData.email || (isLoggedIn ? null : formData.email),
        category: formData.category,
        title: formData.title.trim(),
        description: formData.description.trim(),
        page_url: window.location.href,
        browser_info: navigator.userAgent,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Bug report submitted! Thank you for helping us improve.');
      
      // Reset after showing success
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ category: '', title: '', description: '', email: '' });
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit bug report:', error);
      toast.error('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ category: '', title: '', description: '', email: '' });
      setErrors({});
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Bug className="w-5 h-5 text-warning" />
            Report a Bug
          </DialogTitle>
          <DialogDescription>
            Found something broken? Let us know and we'll fix it!
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4 animate-bounce" />
            <h3 className="font-display text-xl font-bold mb-2">Thank You!</h3>
            <p className="text-muted-foreground">Your bug report has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select bug category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Bug Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-destructive' : ''}
                maxLength={100}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please describe the bug in detail. Include steps to reproduce if possible."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`min-h-[120px] ${errors.description ? 'border-destructive' : ''}`}
                maxLength={2000}
              />
              <div className="flex justify-between">
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {formData.description.length}/2000
                </p>
              </div>
            </div>

            {/* Email (only show if not logged in) */}
            {!isLoggedIn && (
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Provide your email if you'd like us to follow up on your report.
                </p>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            )}

            {/* Info box */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
              <p className="text-muted-foreground">
                📍 Current page and browser info will be automatically included to help us debug.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gaming"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BugReportModal;