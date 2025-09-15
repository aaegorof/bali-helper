"use client"

import React from 'react';

export default function TestStyles() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Тестирование стилей</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-background border border-border rounded-lg">
          Background
        </div>
        
        <div className="p-4 bg-foreground text-background border border-border rounded-lg">
          Foreground
        </div>
        
        <div className="p-4 bg-primary text-primary-foreground border border-border rounded-lg">
          Primary
        </div>
        
        <div className="p-4 bg-secondary text-secondary-foreground border border-border rounded-lg">
          Secondary
        </div>
        
        <div className="p-4 bg-muted text-muted-foreground border border-border rounded-lg">
          Muted
        </div>
        
        <div className="p-4 bg-accent text-accent-foreground border border-border rounded-lg">
          Accent
        </div>
        
        <div className="p-4 bg-destructive text-destructive-foreground border border-border rounded-lg">
          Destructive
        </div>
        
        <div className="p-4 bg-card text-card-foreground border border-border rounded-lg">
          Card
        </div>
      </div>
    </div>
  );
} 