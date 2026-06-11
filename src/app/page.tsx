import { getAllowedRoleProtectedItems } from '@/app/lib/route-access-server';
import { menuItems } from '@/components/menuItems';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default async function Home() {
  const allowedMenuItems = await getAllowedRoleProtectedItems(menuItems);

  return (
    <main>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {allowedMenuItems.map((item) => (
            <ModuleCard
              key={item.href}
              title={item.title}
              description={item.description}
              href={item.href}
            />
          ))}
        </div>
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
        <Button asChild className="w-full">
          <Link href={href}>Open</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
