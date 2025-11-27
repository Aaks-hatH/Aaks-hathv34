import * as React from "react"
export const Select = ({ value, onValueChange, children }) => {
  return <div className="relative inline-block w-48">{React.Children.map(children, child => React.cloneElement(child, { value, onValueChange }))}</div>
}
export const SelectTrigger = ({ children }) => <div className="p-2 border border-slate-700 rounded bg-slate-800 text-slate-300 cursor-pointer">{children}</div>
export const SelectValue = ({ placeholder }) => <span>{placeholder}</span>
export const SelectContent = ({ children, value, onValueChange }) => (
  <div className="absolute mt-1 w-full bg-slate-800 border border-slate-700 rounded shadow-lg z-50">
    {React.Children.map(children, child => React.cloneElement(child, { onClick: () => onValueChange(child.props.value) }))}
  </div>
)
export const SelectItem = ({ value, children, onClick }) => (
  <div onClick={onClick} className="p-2 hover:bg-slate-700 cursor-pointer text-slate-300 text-sm">
    {children}
  </div>
)