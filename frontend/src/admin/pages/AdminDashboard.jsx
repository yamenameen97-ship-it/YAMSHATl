import { useMemo } from 'react';

export default function AdminDashboard() {
  const stats = useMemo(() => ([
    { title: 'إجمالي المستخدمين', value: '128,560', growth: '+12.5%', icon: '👥' },
    { title: 'البث المباشر', value: '1,245', growth: '+18.7%', icon: '📡' },
    { title: 'المشاهدات الكلية', value: '2.45M', growth: '+15.3%', icon: '👁️' },
    { title: 'الإيرادات', value: '$45,231', growth: '+21.4%', icon: '💰' },
  ]), []);

  const logs = [
    '[INFO] تم تشغيل البث بنجاح',
    '[LIVE] مستخدم جديد بدأ البث',
    '[WARN] ارتفاع بسيط في الضغط',
    '[INFO] تمت إضافة منشور جديد',
    '[OK] النظام يعمل بكفاءة',
  ];

  const users = ['PlayerOne', 'ShadowGirl', 'KhaledGamer', 'MoxX'];

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: '#050816',
      color: '#fff',
      padding: '24px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:30}}>
        <div>
          <h1 style={{fontSize:32,fontWeight:'bold'}}>لوحة التحكم</h1>
          <p style={{color:'#94a3b8'}}>نظام الإدارة الحديث</p>
        </div>

        <input
          placeholder="بحث..."
          style={{
            width:320,
            background:'#0f172a',
            border:'1px solid #312e81',
            borderRadius:16,
            padding:'14px 18px',
            color:'#fff'
          }}
        />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,marginBottom:30}}>
        {stats.map((item) => (
          <div key={item.title} style={{
            background:'#0f172a',
            border:'1px solid rgba(255,255,255,.08)',
            borderRadius:24,
            padding:24,
            boxShadow:'0 0 25px rgba(124,58,237,.18)'
          }}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:15}}>
              <span style={{fontSize:28}}>{item.icon}</span>
              <span style={{color:'#22c55e'}}>{item.growth}</span>
            </div>

            <div style={{color:'#94a3b8',marginBottom:8}}>{item.title}</div>
            <div style={{fontSize:34,fontWeight:'bold'}}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,marginBottom:20}}>
        <div style={{
          background:'#0f172a',
          borderRadius:28,
          padding:24,
          border:'1px solid rgba(255,255,255,.08)'
        }}>
          <h2 style={{fontSize:24,fontWeight:'bold',marginBottom:20}}>المشاهدات خلال 7 أيام</h2>

          <div style={{height:320,display:'flex',alignItems:'end',gap:16}}>
            {[120,220,180,300,160,260,340].map((h,i) => (
              <div key={i} style={{flex:1,textAlign:'center'}}>
                <div style={{
                  height:h,
                  borderRadius:'20px 20px 0 0',
                  background:'linear-gradient(to top,#7c3aed,#c026d3)',
                  boxShadow:'0 0 20px rgba(168,85,247,.45)'
                }} />
                <div style={{marginTop:10,color:'#94a3b8',fontSize:12}}>{12+i} مايو</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background:'#0f172a',
          borderRadius:28,
          padding:24,
          border:'1px solid rgba(255,255,255,.08)'
        }}>
          <h2 style={{fontSize:24,fontWeight:'bold',marginBottom:20}}>سجل الأحداث</h2>

          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {logs.map((log,index) => (
              <div key={index} style={{
                background:'#111827',
                borderRadius:16,
                padding:14,
                color:'#cbd5e1',
                border:'1px solid rgba(255,255,255,.05)'
              }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background:'#0f172a',
        borderRadius:28,
        padding:24,
        border:'1px solid rgba(255,255,255,.08)'
      }}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
          <h2 style={{fontSize:24,fontWeight:'bold'}}>إدارة المستخدمين</h2>
          <button style={{
            background:'linear-gradient(to left,#7c3aed,#c026d3)',
            border:'none',
            color:'#fff',
            padding:'12px 18px',
            borderRadius:14,
            cursor:'pointer'
          }}>
            إضافة مستخدم
          </button>
        </div>

        <div style={{display:'grid',gap:14}}>
          {users.map((user,index) => (
            <div key={user} style={{
              background:'#111827',
              borderRadius:18,
              padding:18,
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{
                  width:48,
                  height:48,
                  borderRadius:14,
                  background:'linear-gradient(to bottom right,#7c3aed,#ec4899)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontWeight:'bold'
                }}>
                  {index+1}
                </div>

                <div>
                  <div style={{fontWeight:'bold'}}>{user}</div>
                  <div style={{fontSize:13,color:'#94a3b8'}}>مستخدم نشط</div>
                </div>
              </div>

              <span style={{
                background:'rgba(34,197,94,.15)',
                color:'#22c55e',
                padding:'8px 12px',
                borderRadius:999
              }}>
                نشط
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
