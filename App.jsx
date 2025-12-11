/*
Compact single-file React frontend for Win Tala.
- Uses axios (defaults to REACT_APP_API_BASE or /api)
- Routes: /, /product/:id, /cart, /login, /register, /admin
- Tailwind for styling
*/
import React, { useEffect, useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_BASE || '/api'
axios.defaults.baseURL = API_BASE
axios.defaults.withCredentials = true

const AuthContext = createContext()
function useAuth() { return useContext(AuthContext) }

function AuthProvider({ children }){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    axios.get('/auth/me').then(r=>{ setUser(r.data); }).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const login = async ({email,password})=>{
    const r = await axios.post('/auth/login',{email,password})
    setUser(r.data.user)
    return r.data
  }
  const logout = async ()=>{
    await axios.post('/auth/logout')
    setUser(null)
  }
  const register = async (payload)=>{
    const r = await axios.post('/auth/register', payload)
    setUser(r.data.user)
    return r.data
  }

  return <AuthContext.Provider value={{user,loading,login,logout,register,setUser}}>{children}</AuthContext.Provider>
}

function MultiLevelMenu({categories}){
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">وین طلا</Link>
            <div className="hidden md:flex md:ml-8">
              {categories.map(cat=> (
                <div key={cat.id} className="group relative ml-6">
                  <Link to={`/category/${cat.id}`} className="py-2 px-3 inline-block">{cat.name}</Link>
                  {cat.children && cat.children.length>0 && (
                    <div className="absolute left-0 top-full mt-2 bg-white border rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      {cat.children.map(sub=> (
                        <Link key={sub.id} to={`/category/${sub.id}`} className="block px-4 py-2 whitespace-nowrap">{sub.name}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <SearchBar />
            <CartIcon />
            <ProfileMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}

function SearchBar(){
  const [q,setQ] = useState('')
  const navigate = useNavigate()
  const submit = (e)=>{ e.preventDefault(); if(!q) return; navigate(`/search?q=${encodeURIComponent(q)}`) }
  return (
    <form onSubmit={submit} className="mr-4">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجو" className="border rounded px-2 py-1" />
    </form>
  )
}

function CartIcon(){
  const [count,setCount] = useState(0)
  useEffect(()=>{
    axios.get('/cart/count').then(r=>setCount(r.data.count)).catch(()=>{})
  },[])
  return <Link to="/cart" className="mr-4">🛒 {count>0 && <span className="text-sm">{count}</span>}</Link>
}

function ProfileMenu(){
  const {user,logout} = useAuth()
  const navigate = useNavigate()
  if(!user) return <Link to="/login" className="mr-4">ورود / ثبت‌نام</Link>
  return (
    <div className="flex items-center mr-4">
      <span className="ml-2">{user.name}</span>
      <button onClick={()=>{ logout(); navigate('/') }} className="text-sm px-2 py-1 border rounded">خروج</button>
    </div>
  )
}

function Home(){
  const [products,setProducts] = useState([])
  const [categories,setCategories] = useState([])
  useEffect(()=>{
    axios.get('/categories').then(r=>setCategories(r.data)).catch(()=>{})
    axios.get('/products?limit=24').then(r=>setProducts(r.data)).catch(()=>{})
  },[])

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Hero />
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-3">پیشنهادها برای شما</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map(p=> <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  )
}

function Hero(){
  return (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg p-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">وین طلا — خرید امن طلا آنلاین</h1>
        <p className="mt-1 text-sm">قیمت روز، ارسال سریع، گارانتی اصالت</p>
      </div>
      <img src="/hero-gold.png" alt="hero" className="w-40 h-24 object-contain" />
    </div>
  )
}

function ProductCard({product}){
  return (
    <Link to={`/product/${product.id}`} className="block border rounded overflow-hidden hover:shadow-lg">
      <div className="p-3 bg-white h-40 flex items-center justify-center">
        <img src={product.image || '/placeholder.png'} alt={product.title} className="max-h-full" />
      </div>
      <div className="p-3 bg-white">
        <h3 className="text-sm font-medium truncate">{product.title}</h3>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm">{product.weight}g</div>
          <div className="text-base font-bold">{formatPrice(product.price)}</div>
        </div>
      </div>
    </Link>
  )
}

function formatPrice(v){ if(v==null) return '—'; return new Intl.NumberFormat('fa-IR').format(v) + ' تومان' }

function CategoryPage(){
  const {id} = useParams()
  const [products,setProducts] = useState([])
  useEffect(()=>{ axios.get(`/categories/${id}/products`).then(r=>setProducts(r.data)).catch(()=>{}) },[id])
  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">نتایج دسته‌بندی</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map(p=> <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}

function ProductDetails(){
  const {id} = useParams()
  const [p,setP] = useState(null)
  const [adding,setAdding] = useState(false)
  useEffect(()=>{ axios.get(`/products/${id}`).then(r=>setP(r.data)).catch(()=>{}) },[id])
  if(!p) return <div className="p-6">در حال بارگذاری...</div>

  const addToCart = async ()=>{
    setAdding(true)
    await axios.post('/cart/add',{product_id:p.id, qty:1}).catch(()=>{})
    setAdding(false)
  }

  return (
    <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded shadow">
        <img src={p.image || '/placeholder.png'} alt={p.title} className="w-full h-80 object-contain" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{p.title}</h1>
        <p className="mt-2">وزن: {p.weight} گرم</p>
        <div className="mt-4 text-2xl font-extrabold">{formatPrice(p.price)}</div>
        <div className="mt-6">
          <button onClick={addToCart} disabled={adding} className="px-4 py-2 rounded shadow border">{adding ? 'در حال اضافه...' : 'افزودن به سبد'}</button>
        </div>
        <div className="mt-6 text-sm text-gray-600">ارسال: ۲۴-۴۸ ساعت | تضمین اصالت</div>
      </div>
    </div>
  )
}

function CartPage(){
  const [items,setItems] = useState([])
  useEffect(()=>{ axios.get('/cart').then(r=>setItems(r.data.items)).catch(()=>{}) },[])
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">سبد خرید</h2>
      {items.length===0 ? <div>سبد خالی است</div> : (
        <div className="space-y-4">
          {items.map(it=> (
            <div key={it.id} className="flex items-center justify-between border rounded p-3">
              <div className="flex items-center gap-4">
                <img src={it.product.image||'/placeholder.png'} alt="" className="w-16 h-16 object-contain" />
                <div>
                  <div className="font-medium">{it.product.title}</div>
                  <div className="text-sm">تعداد: {it.qty}</div>
                </div>
              </div>
              <div className="font-bold">{formatPrice(it.total)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LoginPage(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const {login} = useAuth()
  const navigate = useNavigate()
  const submit = async (e)=>{ e.preventDefault(); try{ await login({email,password}); navigate('/') }catch(err){ alert('ورود ناموفق') } }
  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">ورود</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="ایمیل" className="w-full border px-3 py-2 rounded" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="رمز عبور" className="w-full border px-3 py-2 rounded" />
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 border rounded">ورود</button>
          <Link to="/register" className="text-sm">حساب ندارید؟ ثبت‌نام</Link>
        </div>
      </form>
    </div>
  )
}

function RegisterPage(){
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const {register} = useAuth()
  const navigate = useNavigate()
  const submit = async (e)=>{ e.preventDefault(); try{ await register({name,email,password}); navigate('/') }catch(err){ alert('ثبت‌نام ناموفق') } }
  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">ثبت‌نام</h2>
      <form onSubmit={submit} className="space-y-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="نام" className="w-full border px-3 py-2 rounded" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="ایمیل" className="w-full border px-3 py-2 rounded" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="رمز عبور" className="w-full border px-3 py-2 rounded" />
        <button className="px-4 py-2 border rounded">ثبت‌نام</button>
      </form>
    </div>
  )
}

function AdminPanel(){
  const {user} = useAuth()
  if(!user || !user.is_admin) return <div className="p-6">دسترسی ندارید</div>
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">پنل مدیریت</h2>
      <p className="text-sm text-gray-600">اینجا می‌تونی محصولات اضافه/ویرایش، سفارش‌ها و کاربران رو مدیریت کنی. (رابط API در بک‌اند)
      </p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4 bg-white"><h3 className="font-medium mb-2">محصولات</h3><Link to="/admin/products" className="text-sm underline">مدیریت محصولات</Link></div>
        <div className="border rounded p-4 bg-white"><h3 className="font-medium mb-2">سفارش‌ها</h3><Link to="/admin/orders" className="text-sm underline">مدیریت سفارش‌ها</Link></div>
      </div>
    </div>
  )
}

function Card({title,children}){
  return (<div className="border rounded p-4 bg-white"><h3 className="font-medium mb-2">{title}</h3>{children}</div>)
}

export default function App(){
  const [categories,setCategories] = useState([])
  useEffect(()=>{
    axios.get('/categories/navigation').then(r=>setCategories(r.data)).catch(()=>{
      setCategories([{id:'1',name:'زیورآلات', children:[{id:'11',name:'گردنبند'},{id:'12',name:'انگشتر'}]},{id:'2',name:'سکه'}])
    })
  },[])

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <MultiLevelMenu categories={categories} />
          <main className="py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:id" element={<CategoryPage />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/*" element={<AdminPanel />} />
            </Routes>
          </main>
          <footer className="bg-white border-t py-6 mt-12">
            <div className="max-w-7xl mx-auto px-4 text-sm text-gray-600">© {new Date().getFullYear()} وین طلا — تمام حقوق محفوظ است</div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  )
}
