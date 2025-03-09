"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, InputLabel } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function UpdateDataForm() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey || !apiSecret) {
      setError('API Key and Secret are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // In a real application, you would send this to your backend
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in localStorage (not secure, just for demo)
      localStorage.setItem('bybit_api_key', apiKey);
      localStorage.setItem('bybit_api_secret', apiSecret);
      
      setSuccess(true);
      // Clear form after successful submission
      setApiKey('');
      setApiSecret('');
    } catch (err) {
      console.error('Error updating API credentials:', err);
      setError('Failed to update API credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update API Credentials</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputLabel label="API Key">
            <Input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Bybit API Key"
            />
          </InputLabel>
          
          <InputLabel label="API Secret">
            <Input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your Bybit API Secret"
            />
          </InputLabel>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update Credentials'}
          </Button>
          
          {error && (
            <p className="text-destructive text-sm mt-2">{error}</p>
          )}
          
          {success && (
            <p className="text-green-500 text-sm mt-2">
              API credentials updated successfully!
            </p>
          )}
          
          <div className="text-sm text-muted-foreground mt-4">
            <p>Your API credentials are used to fetch your trading data from Bybit.</p>
            <p className="mt-1">For security, create API keys with read-only permissions.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 