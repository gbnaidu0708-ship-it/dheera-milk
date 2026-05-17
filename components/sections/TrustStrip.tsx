const ITEMS = [
  { icon: '🧪', label: '100% Pure Milk'          },
  { icon: '🚫', label: 'No Preservatives'         },
  { icon: '🏭', label: 'Hygienically Processed'  },
  { icon: '🚚', label: 'Farm Fresh Delivery'     },
  { icon: '👨‍👩‍👧‍👦', label: 'Trusted by Families'     },
]

export default function TrustStrip() {
  return (
    <div className="px-[5%] py-7" style={{ background: 'var(--blue-deep)' }}>
      <div className="max-w-6xl mx-auto flex flex-wrap justify-around gap-5">
        {ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2.5 text-white">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-sm font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
