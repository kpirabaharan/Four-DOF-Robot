'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

import { Input } from '@/components/ui/input';
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

const formSchema = z.object({
  j1: z.coerce.number().int().gte(-90).lte(266),
  j2: z.coerce.number().int().gte(-150).lte(150),
  j3: z.coerce.number().int().gte(-162).lte(162),
  jz: z.coerce.number().int().gte(0).lte(150),
});

type FormValues = z.infer<typeof formSchema>;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const JointControls = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      j1: 0,
      j2: 0,
      j3: 0,
      jz: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await api.post('/api/joint-controls', values);
      console.log({ response });
    } catch (err) {
      console.log(err);
    }
  };

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
