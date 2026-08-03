import { describe, expect, it, vi } from 'vitest'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PaymentMethodField } from '@/components/checkout/payment-method-field'
import { checkoutSchema, type CheckoutInput } from '@/lib/schemas'
import { fireEvent, render, screen, waitFor } from '../utils/render'

/** فرم کوچک واقعی — تا اتصال register واقعاً آزموده شود، نه mock */
function Harness({ onValid }: { onValid: (data: CheckoutInput) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      receiverName: 'رضا کریمی',
      phone: '09123456789',
      province: 'تهران',
      city: 'تهران',
      address: 'خیابان ولیعصر، پلاک ۱۲۳، واحد ۴',
      postalCode: '1234567890',
      note: '',
      paymentMethod: 'online',
    },
  })

  return (
    <form onSubmit={handleSubmit(onValid)}>
      <PaymentMethodField
        registration={register('paymentMethod')}
        error={errors.paymentMethod?.message}
      />
      <button type="submit">ثبت</button>
    </form>
  )
}

describe('PaymentMethodField', () => {
  it('گروه رادیو با legend قابل فهم برای screen reader است', () => {
    render(<Harness onValid={vi.fn()} />)
    expect(screen.getByRole('group', { name: /روش پرداخت/ })).toBeInTheDocument()
  })

  it('هر دو روش نمایش داده می‌شوند', () => {
    render(<Harness onValid={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /پرداخت آنلاین/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /پرداخت در محل/ })).toBeInTheDocument()
  })

  it('روش غیرفعال disabled است و انتخاب نمی‌شود', () => {
    render(<Harness onValid={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /پرداخت در محل/ })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /پرداخت آنلاین/ })).toBeEnabled()
  })

  it('گزینهٔ پیش‌فرض «آنلاین» انتخاب شده است', () => {
    render(<Harness onValid={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /پرداخت آنلاین/ })).toBeChecked()
  })

  it('🔑 مقدار انتخابی واقعاً به onSubmit می‌رسد', async () => {
    // این همان باگی است که رفع شد: پیش از این رادیو خارج از RHF بود
    // و paymentMethod هرگز در payload نبود.
    const onValid = vi.fn()
    render(<Harness onValid={onValid} />)

    fireEvent.click(screen.getByRole('button', { name: 'ثبت' }))

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1))
    expect(onValid.mock.calls[0][0]).toMatchObject({ paymentMethod: 'online' })
  })

  it('پیام خطا با role=alert اعلام می‌شود', () => {
    function ErrorHarness() {
      const { register } = useForm<CheckoutInput>()
      return (
        <PaymentMethodField
          registration={register('paymentMethod')}
          error="این روش پرداخت در حال حاضر فعال نیست"
        />
      )
    }
    render(<ErrorHarness />)
    expect(screen.getByRole('alert')).toHaveTextContent('فعال نیست')
  })
})
