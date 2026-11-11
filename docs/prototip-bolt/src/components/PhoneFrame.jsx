export default function PhoneFrame({ label, children }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <div className="text-xs font-semibold text-white/40 tracking-widest uppercase">
          {label}
        </div>
      )}
      <div className="w-[390px] h-[780px] rounded-[40px] border border-white/10 bg-bg overflow-hidden relative shadow-2xl shadow-black/60">
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center z-20">
          <div className="w-28 h-5 bg-black rounded-full mt-1" />
        </div>
        <div className="h-full overflow-y-auto pt-8 pb-24 px-4">
          {children}
        </div>
      </div>
    </div>
  )
}
