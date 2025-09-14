import { LoaderCircle } from 'lucide-react';
import { PropsWithChildren } from 'react';

type LoaderProps = PropsWithChildren<{ data?: any }>;

const Loader = ({ children, data }: LoaderProps) => {
  if (data !== undefined && data !== null && 
      (Array.isArray(data) ? data.length > 0 : 
      typeof data === 'object' ? Object.keys(data).length > 0 : 
      data !== '' && data !== 0)) {
    return null
  }
  return (
    <div className="grid place-items-center h-full">
      <div className="flex gap-2">
        <LoaderCircle className="animate-spin" /> {children}
      </div>
    </div>
  );
};

export default Loader;
