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
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  j1: z.coerce.number().int().gte(-90).lte(266),
  j2: z.coerce.number().int().gte(-150).lte(150),
  j3: z.coerce.number().int().gte(-162).lte(162),
  jz: z.coerce.number().int().gte(0).lte(150),
});

type FormValues = z.infer<typeof formSchema>;

const JointControls = () => {
  const { toast } = useToast();

  const { data, isLoading, error } = useSWR('/api/joint-controls', fetcher, {
    refreshInterval: 1000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { j1: 0, j2: 0, j3: 0, jz: 0 },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post('/api/joint-controls', values);
      toast({
        title: 'Moving Robot...',
        description: `J1: ${values.j1}, J2: ${values.j2}, J3: ${values.j3}, JZ: ${values.jz}`,
      });
    } catch (err) {
      console.log(err);
    }
  };

  if (isLoading) return <Skeleton className='h-[334px] w-[384px] rounded-lg' />;

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
            <CardTitle>Joint Angles</CardTitle>
          </CardHeader>

          <CardContent className='flex flex-col gap-y-4'>
            <FormField
              control={form.control}
              name='j1'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-8 gap-x-4 items-center'>
                    <FormLabel>J1</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' {...field} />
                    </FormControl>
                    <FormDescription className='col-span-3 text-nowrap ml-auto'>
                      (-90° - 266°)
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='j2'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-8 gap-x-4 items-center'>
                    <FormLabel>J2</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' {...field} />
                    </FormControl>
                    <FormDescription className='col-span-3 text-nowrap ml-auto'>
                      (-150° - 150°)
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='j3'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-8 gap-x-4 items-center'>
                    <FormLabel>J3</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' {...field} />
                    </FormControl>
                    <FormDescription className='col-span-3 text-nowrap ml-auto'>
                      (-162° - 162°)
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='jz'
              render={({ field }) => (
                <FormItem>
                  <div className='grid grid-cols-8 gap-x-4 items-center'>
                    <FormLabel>JZ</FormLabel>
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

export default JointControls;
