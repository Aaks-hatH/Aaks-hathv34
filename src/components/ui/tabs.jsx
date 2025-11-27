import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext({ value: "", onValueChange: () => {} });

const Tabs = React.forwardRef(({ defaultValue, className, ...props }, ref) => {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div ref={ref} className={cn("", className)} {...props} />
    </TabsContext.Provider>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-800 p-1 text-slate-400", className)} {...props} />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  const isActive = context.value === value;
  return (
    <button
      ref={ref}
      onClick={() => context.onValueChange(value)}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:text-slate-100",
        isActive && "bg-slate-950 text-slate-100 shadow-sm",
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  if (context.value !== value) return null;
  return (
    <div ref={ref} className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...props} />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }