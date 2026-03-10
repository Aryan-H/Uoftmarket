
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Bell, Mail } from 'lucide-react';

interface NotificationPreferences {
  id?: string;
  user_id: string;
  new_listings_email: boolean;
  new_requests_email: boolean;
  categories: string[];
  request_categories: string[];
  location_filter: string | null;
  max_price: number | null;
  min_budget: number | null;
  max_budget: number | null;
  frequency: 'immediate' | 'daily' | 'weekly';
}

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Sports',
  'Vehicles',
  'Home & Garden',
  'Jewelry',
  'Toys & Games',
  'Other'
];

const LOCATIONS = [
  'St George',
  'Mississauga',
  'Scarborough',
  'Robarts',
  'Bahen',
  'Sidney Smith',
  'Medical Sciences',
  'Myhal',
  'Wallberg',
  'Off-Campus'
];

export default function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id]);

  const fetchPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          ...data,
          frequency: data.frequency as 'immediate' | 'daily' | 'weekly'
        });
      } else {
        // Create default preferences
        const defaultPrefs: NotificationPreferences = {
          user_id: user.id,
          new_listings_email: true,
          new_requests_email: true,
          categories: [],
          request_categories: [],
          location_filter: null,
          max_price: null,
          min_budget: null,
          max_budget: null,
          frequency: 'immediate'
        };
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id || !preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          ...preferences,
          user_id: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Notification preferences saved successfully');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (!preferences) return;

    const updatedCategories = checked
      ? [...preferences.categories, category]
      : preferences.categories.filter(c => c !== category);

    setPreferences({
      ...preferences,
      categories: updatedCategories
    });
  };

  const handleRequestCategoryChange = (category: string, checked: boolean) => {
    if (!preferences) return;

    const updatedCategories = checked
      ? [...preferences.request_categories, category]
      : preferences.request_categories.filter(c => c !== category);

    setPreferences({
      ...preferences,
      request_categories: updatedCategories
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading notification settings...
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Unable to load notification preferences.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications about new listings and requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Listing Email Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              New Listing Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications when new listings are posted
            </p>
          </div>
          <Switch
            checked={preferences.new_listings_email}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, new_listings_email: checked })
            }
          />
        </div>

        {/* Request Email Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              New Request Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive email notifications when new requests are posted
            </p>
          </div>
          <Switch
            checked={preferences.new_requests_email}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, new_requests_email: checked })
            }
          />
        </div>

        {(preferences.new_listings_email || preferences.new_requests_email) && (
          <>
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Notification Frequency</Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value: 'immediate' | 'daily' | 'weekly') =>
                  setPreferences({ ...preferences, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Digest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how often you want to receive notifications
              </p>
            </div>
          </>
        )}

        {preferences.new_listings_email && (
          <>
            {/* Listing Categories */}
            <div className="space-y-3">
              <Label>Listing Categories of Interest</Label>
              <p className="text-sm text-muted-foreground">
                Select categories you want to be notified about (leave empty for all categories)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={preferences.categories.includes(category)}
                      onCheckedChange={(checked) =>
                        handleCategoryChange(category, checked as boolean)
                      }
                    />
                    <Label htmlFor={category} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <Label>Location Filter</Label>
              <Select
                value={preferences.location_filter || 'all'}
                onValueChange={(value) =>
                  setPreferences({
                    ...preferences,
                    location_filter: value === 'all' ? null : value
                  })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Locations</SelectItem>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Only receive notifications for listings in specific locations
              </p>
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <Label htmlFor="maxPrice">Maximum Price</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="e.g., 500"
                value={preferences.max_price || ''}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    max_price: e.target.value ? Number(e.target.value) : null
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Only receive notifications for listings under this price
              </p>
            </div>
          </>
        )}

        {preferences.new_requests_email && (
          <>
            {/* Request Categories */}
            <div className="space-y-3">
              <Label>Request Categories of Interest</Label>
              <p className="text-sm text-muted-foreground">
                Select categories you want to be notified about (leave empty for all categories)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <div key={`request-${category}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`request-${category}`}
                      checked={preferences.request_categories.includes(category)}
                      onCheckedChange={(checked) =>
                        handleRequestCategoryChange(category, checked as boolean)
                      }
                    />
                    <Label htmlFor={`request-${category}`} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minBudget">Minimum Budget</Label>
                <Input
                  id="minBudget"
                  type="number"
                  placeholder="e.g., 50"
                  value={preferences.min_budget || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      min_budget: e.target.value ? Number(e.target.value) : null
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Only notify for requests above this budget
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBudget">Maximum Budget</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  placeholder="e.g., 1000"
                  value={preferences.max_budget || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      max_budget: e.target.value ? Number(e.target.value) : null
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Only notify for requests below this budget
                </p>
              </div>
            </div>
          </>
        )}

        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
