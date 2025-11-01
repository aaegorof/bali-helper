'use client';
import { menuItems } from '@/components/menuItems';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="container mx-auto">
      <h1>Home page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {menuItems.map((item) => (
          <ModuleCard
            key={item.href}
            title={item.title}
            description={item.description}
            href={item.href}
          />
        ))}
      </div>
    </main>
  );
}

function ModuleCard({
  title,
  description,
  href,
}: {
  href: string;
  title: string;
  description?: string;
}) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">{/* Content can be added here if needed */}</CardContent>
      <CardFooter>
        <Link href={href} className="w-full">
          <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md">
            Open
          </button>
        </Link>
      </CardFooter>
    </Card>
  );
}
