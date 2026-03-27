import { Button } from '../../../shared/ui/Button'

interface AdminCodeLookupFormProps {
  code: string
  onCodeChange: (value: string) => void
  onLookup: () => void
}

export function AdminCodeLookupForm({ code, onCodeChange, onLookup }: AdminCodeLookupFormProps) {
  return (
    <section className="rounded-[2rem] bg-white p-8 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Поиск заявки</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1a1c1a]">Найдите заявку по коду</h1>
      <p className="mt-3 text-sm leading-6 text-[#404943]">
        Администратор вводит постоянный код пользователя и получает точный состав призов для выдачи.
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <input
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder="Например, TRL-AB12-4567"
          className="flex-1 rounded-[1.25rem] border border-[#d6ddd6] bg-[#f9faf6] px-5 py-4 text-xl font-bold uppercase tracking-[0.08em] outline-none focus:border-[#0f5238]"
        />
        <Button onClick={onLookup} className="px-7 py-4 text-base">
          Найти заявку
        </Button>
      </div>
    </section>
  )
}
