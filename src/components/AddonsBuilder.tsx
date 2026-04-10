interface AddonDraft {
  name: string
  price: string
}

interface AddonsBuilderProps {
  addons: AddonDraft[]
  setAddons: React.Dispatch<React.SetStateAction<AddonDraft[]>>
}

export default function AddonsBuilder({ addons, setAddons }: AddonsBuilderProps) {
  const addAddonRow = () => {
    setAddons((prev) => [...prev, { name: '', price: '0' }])
  }

  const removeAddonRow = (index: number) => {
    setAddons((prev) => prev.filter((_, i) => i !== index))
  }

  const updateAddonRow = (index: number, field: 'name' | 'price', value: string) => {
    setAddons((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          Custom Add-ons
        </label>
        <button
          type="button"
          onClick={addAddonRow}
          className="text-xs font-semibold text-jamaica-green hover:text-jamaica-green-dark"
        >
          + Add add-on
        </button>
      </div>
      {addons.length === 0 && (
        <p className="text-xs text-gray-500">No add-ons yet. Add optional extras with any price, including 0 for free.</p>
      )}
      {addons.map((addon, index) => (
        <div key={`${index}`} className="grid grid-cols-12 gap-2 items-center">
          <input
            type="text"
            value={addon.name}
            onChange={(e) => updateAddonRow(index, 'name', e.target.value)}
            className="col-span-7 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-jamaica-green bg-white text-sm"
            placeholder="Add-on name"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={addon.price}
            onChange={(e) => updateAddonRow(index, 'price', e.target.value)}
            className="col-span-4 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-jamaica-green bg-white text-sm"
            placeholder="0.00"
          />
          <button
            type="button"
            onClick={() => removeAddonRow(index)}
            className="col-span-1 text-red-500 hover:text-red-600 font-bold"
          >
            x
          </button>
        </div>
      ))}
    </div>
  )
}

