'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { PaymentMethodField } from '@/components/checkout/payment-method-field'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { checkoutSchema, type CheckoutInput } from '@/lib/schemas'
import { cn } from '@/lib/utils'

interface CheckoutFormProps {
  defaultName?: string
  isProcessing: boolean
  onSubmit: (data: CheckoutInput) => void | Promise<void>
}

/**
 * فرم تسویه‌حساب — اعتبارسنجی با checkoutSchema (منبع واحد با فاز بک‌اند).
 */
export function CheckoutForm({ defaultName = '', isProcessing, onSubmit }: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      receiverName: defaultName,
      phone: '',
      province: '',
      city: '',
      address: '',
      postalCode: '',
      note: '',
      paymentMethod: 'online',
    },
  })

  return (
    <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <section className="surface-3d space-y-5 rounded-2xl p-6 md:p-8">
        <header className="flex items-center gap-2">
          <MapPin className="size-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">اطلاعات گیرنده و ارسال</h2>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            id="receiverName"
            label="نام تحویل‌گیرنده"
            required
            error={errors.receiverName?.message}
          >
            <Input
              {...register('receiverName')}
              {...fieldAria('receiverName', !!errors.receiverName)}
              placeholder="نام و نام خانوادگی"
              autoComplete="name"
            />
          </FormField>

          <FormField id="phone" label="شمارهٔ تماس" required error={errors.phone?.message}>
            <Input
              {...register('phone')}
              {...fieldAria('phone', !!errors.phone)}
              dir="ltr"
              inputMode="tel"
              placeholder="09123456789"
              autoComplete="tel"
              className="text-right font-mono"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField id="province" label="استان" required error={errors.province?.message}>
            <Input
              {...register('province')}
              {...fieldAria('province', !!errors.province)}
              placeholder="مثلاً تهران"
              autoComplete="address-level1"
            />
          </FormField>

          <FormField id="city" label="شهر" required error={errors.city?.message}>
            <Input
              {...register('city')}
              {...fieldAria('city', !!errors.city)}
              placeholder="مثلاً تهران"
              autoComplete="address-level2"
            />
          </FormField>
        </div>

        <FormField id="address" label="آدرس دقیق پستی" required error={errors.address?.message}>
          <textarea
            {...register('address')}
            {...fieldAria('address', !!errors.address)}
            rows={3}
            placeholder="خیابان، کوچه، پلاک، واحد"
            autoComplete="street-address"
            className={cn(
              'w-full rounded-xl border border-border bg-input p-3.5 text-sm',
              'shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none',
              'placeholder:text-muted-foreground/70',
              'focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25'
            )}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            id="postalCode"
            label="کد پستی"
            required
            error={errors.postalCode?.message}
            hint="۱۰ رقم بدون خط تیره"
          >
            <Input
              {...register('postalCode')}
              {...fieldAria('postalCode', !!errors.postalCode, true)}
              dir="ltr"
              inputMode="numeric"
              placeholder="1234567890"
              autoComplete="postal-code"
              className="text-right font-mono"
              maxLength={10}
            />
          </FormField>

          <FormField id="note" label="توضیحات سفارش (اختیاری)" error={errors.note?.message}>
            <Input
              {...register('note')}
              {...fieldAria('note', !!errors.note)}
              placeholder="ساعت هماهنگی، پلاک خاص و …"
            />
          </FormField>
        </div>
      </section>

      <section className="surface-3d rounded-2xl p-6 md:p-8">
        <PaymentMethodField
          registration={register('paymentMethod')}
          error={errors.paymentMethod?.message}
        />
      </section>

      {/* دکمهٔ موبایل — در دسکتاپ از خلاصهٔ کناری submit می‌شود */}
      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-base lg:hidden"
        disabled={isProcessing}
      >
        {isProcessing ? 'در حال انتقال به درگاه…' : 'پرداخت و ثبت نهایی'}
      </Button>
    </form>
  )
}
