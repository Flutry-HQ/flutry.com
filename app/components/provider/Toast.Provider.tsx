import React, { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouteLoaderData } from 'react-router';

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const routeData = useRouteLoaderData('root');
  const toastData = routeData?.toastData;
  useEffect(() => {
    if (toastData) {
      switch (toastData.type) {
        case 'success':
          toast.success(toastData.message);
          break;
        case 'error':
          toast.error(toastData.message);
          break;
        default:
          break;
      }
    }
  }, [toastData]);
  return (
    <>
      <Toaster
        position={'bottom-left'}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#0C1327',
            color: '#fff',
            border: '1px solid #192539',
          },
        }}
      />
      {children}
    </>
  );
};
