import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { seedSamplePartners, clearSamplePartners } from '@/lib/supabase/seed-data';
import { Database, Trash2, Users, Store } from 'lucide-react';

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeedData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const result = await seedSamplePartners();
      setResult({
        success: result.success,
        message: result.success ? result.message : result.error || 'Failed to seed data'
      });
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to seed data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      });
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all sample partner data? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const result = await clearSamplePartners();
      setResult({
        success: result.success,
        message: result.success ? result.message : result.error || 'Failed to clear data'
      });
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to clear data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      });
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Seed Data</h1>
        <p className="text-muted-foreground">
          Manage sample partner data for the manufacturers page
        </p>
      </div>

      <div className="grid gap-6">
        {/* Seed Sample Partners */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Seed Sample Partners</CardTitle>
                <CardDescription>
                  Add sample partner data to populate the manufacturers page
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will create 6 sample partner profiles with different categories:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• AutoParts Pro (Premium Auto Parts)</li>
                <li>• Speed Performance (Performance Parts)</li>
                <li>• CarCare Essentials (Car Care Products)</li>
                <li>• Auto Electronics Hub (Car Electronics)</li>
                <li>• Tools & Equipment Plus (Tools & Equipment)</li>
                <li>• Car Accessories World (Car Accessories)</li>
              </ul>
              
              <Button 
                onClick={handleSeedData}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Seeding Data...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Seed Sample Partners
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clear Sample Partners */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Clear Sample Partners</CardTitle>
                <CardDescription>
                  Remove all sample partner data from the database
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>Warning:</strong> This will permanently delete all sample partner profiles, 
                  their products, and associated user accounts. This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleClearData}
                disabled={loading}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Clearing Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Sample Partners
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  result.success 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {result.success ? (
                    <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? 'Success' : 'Error'}
                  </CardTitle>
                  <CardDescription>{result.message}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>To fix the "No shops found" issue:</strong>
              </p>
              <ol className="space-y-2 ml-4">
                <li>1. Click "Seed Sample Partners" to add sample data</li>
                <li>2. Wait for the process to complete</li>
                <li>3. Visit the manufacturers page to see the populated shops</li>
                <li>4. Use "Clear Sample Partners" to remove data when needed</li>
              </ol>
              <p className="pt-2">
                <strong>Note:</strong> The manufacturers page queries for approved partners. 
                This tool creates sample partners with "approved" status so they appear on the page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeedData;
