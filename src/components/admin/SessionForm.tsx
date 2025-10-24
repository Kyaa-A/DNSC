'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionFormProps {
  eventId: string;
  session?: SessionFormData & { id?: string }; // Optional session for editing
  onSubmit: (sessionData: SessionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface SessionFormData {
  name: string;
  description?: string;
  timeInStart: Date;
  timeInEnd: Date;
  timeOutStart: Date;
  timeOutEnd: Date;
  organizerIds?: string[];
  maxCapacity?: number;
  allowWalkIns?: boolean;
  requireRegistration?: boolean;
}

export function SessionForm({ eventId: _eventId, session, onSubmit, onCancel, isSubmitting = false }: SessionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isDirty, isSubmitting: formIsSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<SessionFormData>({
    defaultValues: session ? {
      name: session.name,
      description: session.description || '',
      timeInStart: new Date(session.timeInStart),
      timeInEnd: new Date(session.timeInEnd),
      timeOutStart: new Date(session.timeOutStart),
      timeOutEnd: new Date(session.timeOutEnd),
      organizerIds: session.organizerIds || [],
      maxCapacity: session.maxCapacity,
      allowWalkIns: session.allowWalkIns ?? true,
      requireRegistration: session.requireRegistration ?? false,
    } : {
      name: '',
      description: '',
      timeInStart: new Date(),
      timeInEnd: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes later
      timeOutStart: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
      timeOutEnd: new Date(Date.now() + 90 * 60 * 1000), // 1.5 hours later
      organizerIds: [], // Will be populated by the parent component
      maxCapacity: undefined,
      allowWalkIns: true,
      requireRegistration: false,
    },
  });

  const watchedTimeInStart = watch('timeInStart');
  const watchedTimeInEnd = watch('timeInEnd');
  const watchedTimeOutStart = watch('timeOutStart');

  // Auto-adjust time windows to maintain logical order
  useEffect(() => {
    if (watchedTimeInStart && watchedTimeInEnd) {
      if (watchedTimeInEnd <= watchedTimeInStart) {
        // Set time-in end to 30 minutes after time-in start
        const newTimeInEnd = new Date(watchedTimeInStart.getTime() + 30 * 60 * 1000);
        setValue('timeInEnd', newTimeInEnd);
      }
    }
  }, [watchedTimeInStart, watchedTimeInEnd, setValue]);

  useEffect(() => {
    if (watchedTimeInEnd && watchedTimeOutStart) {
      if (watchedTimeOutStart <= watchedTimeInEnd) {
        // Set time-out start to 30 minutes after time-in end
        const newTimeOutStart = new Date(watchedTimeInEnd.getTime() + 30 * 60 * 1000);
        setValue('timeOutStart', newTimeOutStart);
      }
    }
  }, [watchedTimeInEnd, watchedTimeOutStart, setValue]);

  const handleFormSubmit = handleSubmit(async (data: SessionFormData) => {
    console.log('Form submit triggered with data:', data);
    console.log('Form errors:', errors);
    console.log('Is submitting:', isSubmitting);
    
    try {
      // Convert Date objects to ISO strings for API submission
      const formData = {
        ...data,
        timeInStart: data.timeInStart.toISOString(),
        timeInEnd: data.timeInEnd.toISOString(),
        timeOutStart: data.timeOutStart.toISOString(),
        timeOutEnd: data.timeOutEnd.toISOString(),
      };

      console.log('Submitting session form data:', formData);
      await onSubmit(formData as unknown as SessionFormData);
    } catch (error) {
      console.error('Session creation failed:', error);
    }
  }, (errors) => {
    console.log('Form validation failed:', errors);
    console.log('Validation errors:', errors);
  });

  const handleReset = () => {
    reset();
  };

  return (
    <form onSubmit={(e) => {
      console.log('Form onSubmit event triggered');
      handleFormSubmit(e);
    }} className="space-y-6">
      {/* Session Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Session Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Session name is required' })}
          placeholder="Enter session name"
          className={cn(errors.name && 'border-red-500')}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter session description (optional)"
          rows={3}
          className={cn(errors.description && 'border-red-500')}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Time Windows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="timeInStart"
          control={control}
          rules={{ required: 'Time-in start is required' }}
          render={({ field }) => (
            <DateTimePicker
              label="Time-In Start *"
              value={field.value}
              onChange={field.onChange}
              error={errors.timeInStart?.message}
              minDate={new Date()}
            />
          )}
        />

        <Controller
          name="timeInEnd"
          control={control}
          rules={{ 
            required: 'Time-in end is required',
            validate: (value) => {
              const timeInStart = watch('timeInStart');
              if (timeInStart && value <= timeInStart) {
                return 'Time-in end must be after time-in start';
              }
              return true;
            }
          }}
          render={({ field }) => (
            <DateTimePicker
              label="Time-In End *"
              value={field.value}
              onChange={field.onChange}
              error={errors.timeInEnd?.message}
              minDate={watchedTimeInStart || new Date()}
            />
          )}
        />

        <Controller
          name="timeOutStart"
          control={control}
          rules={{ 
            required: 'Time-out start is required',
            validate: (value) => {
              const timeInEnd = watch('timeInEnd');
              if (timeInEnd && value <= timeInEnd) {
                return 'Time-out start must be after time-in end';
              }
              return true;
            }
          }}
          render={({ field }) => (
            <DateTimePicker
              label="Time-Out Start *"
              value={field.value}
              onChange={field.onChange}
              error={errors.timeOutStart?.message}
              minDate={watchedTimeInEnd || new Date()}
            />
          )}
        />

        <Controller
          name="timeOutEnd"
          control={control}
          rules={{ 
            required: 'Time-out end is required',
            validate: (value) => {
              const timeOutStart = watch('timeOutStart');
              if (timeOutStart && value <= timeOutStart) {
                return 'Time-out end must be after time-out start';
              }
              return true;
            }
          }}
          render={({ field }) => (
            <DateTimePicker
              label="Time-Out End *"
              value={field.value}
              onChange={field.onChange}
              error={errors.timeOutEnd?.message}
              minDate={watchedTimeOutStart || new Date()}
            />
          )}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            console.log('Test button clicked - bypassing validation');
            const formData = watch();
            console.log('Current form data:', formData);
            
            // Test with sample data
            const testData = {
              name: 'Test Session',
              description: 'Test Description',
              timeInStart: new Date(),
              timeInEnd: new Date(Date.now() + 60 * 60 * 1000),
              timeOutStart: new Date(Date.now() + 2 * 60 * 60 * 1000),
              timeOutEnd: new Date(Date.now() + 3 * 60 * 60 * 1000),
            };
            
            console.log('Testing with sample data:', testData);
            onSubmit(testData as unknown as SessionFormData);
          }}
          disabled={isSubmitting}
        >
          Test Submit
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={() => {
            console.log('Submit button clicked');
            console.log('Form state:', { 
              isSubmitting, 
              formIsSubmitting,
              isValid, 
              isDirty,
              errors 
            });
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Creating...' : 'Create Session'}
        </Button>
      </div>
    </form>
  );
}
