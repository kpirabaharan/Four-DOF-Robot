import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';
import { z } from 'zod';

import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/axios';
import { fetcher } from '@/lib/fetcher';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from './ui/skeleton';

const formSchema = z.object({
  xP: z.coerce.number().int().gte(-364).lte(364),
  yP: z.coerce.number().int().gte(-364).lte(364),
  zP: z.coerce.number().int().gte(0).lte(150),
});

type FormValues = z.infer<typeof formSchema>;

const CartesianControls = () => {
  const { toast } = useToast();

  const { data, isLoading, error } = useSWR(
    '/api/cartesian-controls',
    fetcher,
    {
      refreshInterval: 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
    },
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { xP: 0, yP: 0, zP: 0 },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post('/api/cartesian-controls', values);
      toast({
        title: 'Moving Robot...',
        description: `X: ${values.xP}, Y: ${values.yP}, Z: ${values.zP}`,
      });
    } catch (err) {
      console.log(err);
    }
  };

  if (isLoading) return <Skeleton className='h-[282px] w-[384px] rounded-lg' />;

  // TODO: Error UI
  if (error)
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Error: {error.message}</p>
      </div>
    );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card className='w-96'>
          <CardHeader>
            <CardTitle>Cartesian Coordinates</CardTitle>
          </CardHeader>

          <CardContent className='flex flex-col gap-y-4'>
            <FormField
              control={form.control}
              name='xP'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-8 gap-x-4 items-center'>
                    <FormLabel>X</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' {...field} />
                    </FormControl>
                    <FormDescription className='col-span-3 text-nowrap ml-auto'>
                      (364mm - 364mm)
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='yP'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-8 gap-x-4 items-center'>
                    <FormLabel>Y</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' {...field} />
                    </FormControl>
                    <FormDescription className='col-span-3 text-nowrap ml-auto'>
                      (-364mm - 364mm)
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='zP'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-8 gap-x-4 items-center'>
                    <FormLabel>Z</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' {...field} />
                    </FormControl>
                    <FormDescription className='col-span-3 text-nowrap ml-auto'>
                      (0mm - 150mm)
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end'>
              <Button>Send</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};

export default CartesianControls;
