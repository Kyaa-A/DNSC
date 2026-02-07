'use client';

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Mail, User, Shield, Calendar, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Validation schema
const inviteOrganizerSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['organizer', 'admin']),
  assignedEvents: z.array(z.string()),
});

type InviteOrganizerFormInput = z.infer<typeof inviteOrganizerSchema>;

type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

interface InviteOrganizerFormProps {
  onSubmit?: (data: InviteOrganizerFormInput) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<InviteOrganizerFormInput>;
}

export function InviteOrganizerForm({ 
  onSubmit, 
  isSubmitting = false, 
  initialData 
}: InviteOrganizerFormProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [invitationSuccess, setInvitationSuccess] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function fetchEvents() {
      if (!user || authLoading) return;
      
      try {
        const res = await fetch('/api/admin/events');
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch (error) {
        console.error('Failed to load events:', error);
        toast.error('Failed to load events');
      }
    }
    fetchEvents();
  }, [user, authLoading]);

  const form = useForm<InviteOrganizerFormInput>({
    resolver: zodResolver(inviteOrganizerSchema),
    defaultValues: initialData || {
      email: '',
      fullName: '',
      role: 'organizer',
      assignedEvents: [],
    },
  });

  const roleValue = form.watch('role');

  const handleFormSubmit: SubmitHandler<InviteOrganizerFormInput> = async (data) => {
    try {
      setInvitationSuccess(false);
      
      const formData = {
        ...data,
        assignedEvents: selectedEvents,
      };

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default API call
        const response = await fetch('/api/admin/invite-organizer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send invitation');
        }

        const resJson = await response.json();
        toast.success('Invitation sent successfully!', {
          description: `Invitation sent to ${data.email}${resJson.messageId ? ` (messageId: ${resJson.messageId})` : ''}`,
        });
      }

      setInvitationSuccess(true);
      form.reset();
      setSelectedEvents([]);
    } catch (error) {
      setInvitationSuccess(false);
      console.error('Invitation failed:', error);
      toast.error('Failed to send invitation', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  // Show success state
  if (invitationSuccess) {
    return (
      <div className="py-2 sm:py-4">
        <div className="relative">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium mb-3">
              <CheckCircle className="size-3.5" />
              <span>Invitation Sent</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Invitation Sent Successfully</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-prose">
              The organizer invitation has been sent and they will receive an email with instructions.
            </p>
          </div>
          
          <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="p-6 sm:p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Invitation Delivered</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The organizer will receive an email with login instructions and can start managing events once they accept the invitation.
              </p>
              <Button
                onClick={() => setInvitationSuccess(false)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Send Another Invitation
              </Button>
            </div>
            <div className="h-0.5 w-full bg-green-400" />
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while events are being fetched
  if (authLoading || (user && events.length === 0)) {
    return (
      <div className="py-2 sm:py-4">
        <div className="relative">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium mb-3">
              <UserPlus className="size-3.5" />
              <span>Admin Invitation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Invite Organizer</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-prose">
              Loading events...
            </p>
          </div>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 sm:py-4">
      <div className="relative">
        {/* Header Section */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium mb-3">
            <UserPlus className="size-3.5" />
            <span>Admin Invitation</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Invite Organizer</h1>
          
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-prose">
            Send an invitation to a new organizer to join the system and manage events.
          </p>
        </div>

        {/* Invitation Form Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="relative p-6 sm:p-8 space-y-6">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="size-4 text-primary-600" />
                      <FormLabel className="font-semibold text-gray-900 dark:text-gray-100">Email Address</FormLabel>
                    </div>
                    <FormControl>
                      <Input 
                        {...field}
                        type="email"
                        placeholder="organizer@dtp.edu.my"
                        className="h-12 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-primary-400/20 dark:focus:ring-primary-500/20 transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="size-4 text-primary-600" />
                      <FormLabel className="font-semibold text-gray-900 dark:text-gray-100">Full Name</FormLabel>
                    </div>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="John Doe"
                        className="h-12 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-primary-400/20 dark:focus:ring-primary-500/20 transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="size-4 text-primary-600" />
                      <FormLabel className="font-semibold text-gray-900 dark:text-gray-100">Role</FormLabel>
                    </div>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-primary-400/20 dark:focus:ring-primary-500/20">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectItem value="organizer" className="hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Users className="size-4 text-blue-600 dark:text-blue-400" />
                            <span>Event Organizer</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin" className="hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Shield className="size-4 text-red-600 dark:text-red-400" />
                            <span>Administrator</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Assignments (only for organizers) */}
              {roleValue === 'organizer' && events.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="size-4 text-primary-600 dark:text-primary-500" />
                    <FormLabel className="font-semibold text-gray-900 dark:text-gray-100">Assign to Events (Optional)</FormLabel>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {events.map((event) => (
                      <label
                        key={event.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event.id)}
                          onChange={() => toggleEventSelection(event.id)}
                          className="h-4 w-4 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500/50 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {event.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        {!event.isActive && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select events that this organizer should have access to. Leave empty to assign later.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full h-12 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group/btn ${
                    isSubmitting 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300 hover:shadow-lg' 
                      : invitationSuccess
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                      <span>Sending Invitation...</span>
                    </div>
                  ) : invitationSuccess ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="size-4" />
                      <span>Invitation Sent!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="size-4 group-hover/btn:scale-110 transition-transform" />
                      <span>Send Invitation</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="size-3 text-green-500 dark:text-green-400" />
                    <span>Admin Access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="size-3 text-green-500 dark:text-green-400" />
                    <span>Email Invitation</span>
                  </div>
                </div>
              </div>
            </form>
          </Form>

          {/* Bottom Accent Line */}
          <div className={`h-0.5 w-full ${
            invitationSuccess 
              ? 'bg-green-400' 
              : isSubmitting 
              ? 'bg-gray-300'
              : 'bg-primary-400'
          }`} />
        </div>
      </div>
    </div>
  );
}

export default InviteOrganizerForm;
