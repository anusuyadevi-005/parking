import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, Clock, MapPin, Key, Bell, Car, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function SimulationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Data from previous page (Confirmation or Entry)
  const { slot: passedSlot = "A3", key: passedKey = "", parkLocation = "FUNMALL" } = location.state || {};
  const isOverflow = parkLocation === 'SCHOOL' || parkLocation === 'COLLEGE';

  const [slot, setSlot] = useState(passedSlot);
  const [key, setKey] = useState(passedKey);
  const [step, setStep] = useState(0); 
  const [status, setStatus] = useState("Ready to start vehicle arrival simulation...");
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isSlotOpen, setIsSlotOpen] = useState(false);
  const [carPos, setCarPos] = useState({ x: -10, y: 50 });
  const [carRotation, setCarRotation] = useState(0);
  const [activeStep, setActiveStep] = useState(8); 
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [alerts, setAlerts] = useState([]);
  
  const [enteredKey, setEnteredKey] = useState("");
  const [loading, setLoading] = useState(false);

  // Generate dynamic slot list based on the assigned slot
  const generateSlotList = (activeSlot) => {
    const match = activeSlot.match(/([A-Z])(\d+)/);
    if (!match) return ["A1", "A2", "A3", "A4"];
    const prefix = match[1];
    const num = parseInt(match[2]);
    const start = Math.max(1, num - 1);
    return [start, start + 1, start + 2, start + 3].map(n => `${prefix}${n}`);
  };

  const slotList = generateSlotList(slot);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const addAlert = (msg, type = "info") => {
    setAlerts(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 4));
  };

  const allSteps = [
    { id: 8, label: "Car Arrives", icon: <Car size={16} /> },
    { id: 9, label: "Main Gate Verification", icon: <Key size={16} /> },
    { id: 10, label: "Main Gate Opens", icon: <ShieldCheck size={16} /> },
    { id: 11, label: "Navigation Shown", icon: <MapPin size={16} /> },
    { id: 12, label: "Reach Slot", icon: <MapPin size={16} />, hidden: isOverflow },
    { id: 13, label: "Slot Verification", icon: <Key size={16} />, hidden: isOverflow },
    { id: 14, label: "Slot Gate Opens", icon: <CheckCircle2 size={16} />, hidden: isOverflow },
    { id: 15, label: "Car Parked", icon: <Car size={16} /> },
    { id: 16, label: "Timer Starts", icon: <Clock size={16} /> },
    { id: 17, label: "Alerts Sent", icon: <Bell size={16} /> },
    { id: 18, label: "Exit Process", icon: <Car size={16} /> }
  ];

  const steps = allSteps.filter(s => !s.hidden);

  const handleStart = () => {
    setStep(1);
    setActiveStep(8);
    setStatus("Step 8: Car approaching the entrance gate...");
    setCarPos({ x: 15, y: 50 });
    setCarRotation(0);
    addAlert("Vehicle detected at gate", "warning");
    
    setTimeout(() => {
      setStep(1); 
      setActiveStep(9);
      setStatus("Step 9: Main Gate Terminal - Please enter your unique key.");
    }, 2000);
  };

  const handleVerifyMainGate = async () => {
    if (enteredKey.toUpperCase() !== key.toUpperCase()) {
      addAlert("Invalid Key at Main Gate", "error");
      setStatus("❌ Invalid Key. Access Denied.");
      return;
    }

    setLoading(true);
    setStatus("Verifying key with system...");
    
    setTimeout(() => {
      setLoading(false);
      setActiveStep(10);
      setStatus("Step 10: Verification Success! Opening main gate...");
      setIsGateOpen(true);
      addAlert("Main gate access granted", "success");
      setEnteredKey("");

      if (isOverflow) {
        // Overflow Flow: Skip Slot Verification steps
        setTimeout(() => {
          setStep(2);
          setActiveStep(11);
          setStatus(`Navigation system active. Directing to ${parkLocation} Open Zone...`);
          setCarPos({ x: 35, y: 50 });
        }, 1500);

        setTimeout(() => {
          setStatus("Analysis: Primary sections A & B reached 95% capacity.");
          addAlert("Scanning for optimal zone...", "info");
        }, 3000);

        setTimeout(() => {
          setStatus("Suggested: Block C Section 4 currently has 12 free spots. Proceeding...");
          setCarPos({ x: 55, y: 50 });
        }, 4500);

        setTimeout(() => {
          setStep(4);
          setActiveStep(15);
          setStatus(`Area Arrived. You may park in Sector C or anywhere available.`);
          setCarPos({ x: 75, y: 25 });
          setCarRotation(0);
          addAlert("Verified: Gate Entry Only mode", "success");

          setTimeout(() => {
            setActiveStep(16);
            setIsTimerRunning(true);
            setStatus("Session started. Total time will be calculated on exit.");
            addAlert("Timer started", "info");
            
            setTimeout(() => {
              setActiveStep(17);
              addAlert("Monitoring vehicle for safety", "info");
            }, 1000);
          }, 1000);
        }, 6500);

      } else {
        // Original Normal Flow
        setTimeout(() => {
          setStep(2);
          setActiveStep(11);
          setStatus("Step 11: ⬆️ Go straight for 50 meters...");
          setCarPos({ x: 35, y: 50 });
          setCarRotation(0);
        }, 1500);

        setTimeout(() => {
          setStatus("Step 11: ➡️ Move right towards Slot Area...");
          setCarPos({ x: 50, y: 50 });
          setCarRotation(90);
        }, 4000);

        setTimeout(() => {
          setStep(3);
          setActiveStep(12);
          setStatus("Step 12: You have reached your slot " + slot + ".");
          // Calculate exact X based on slot
          const slotIdx = slotList.indexOf(slot);
          const targetX = 54 + (slotIdx * 10);
          setCarPos({ x: targetX, y: 15 });
          setCarRotation(0);
          addAlert("Arrived at target slot " + slot, "info");
        }, 7000);

        setTimeout(() => {
          setActiveStep(13);
          setStatus("Step 13: Slot Terminal - Please enter key again to open barrier.");
        }, 8500);
      }
    }, 1000);
  };

  const handleVerifySlotGate = () => {
    if (enteredKey.toUpperCase() !== key.toUpperCase()) {
      addAlert("Invalid Key at Slot Gate", "error");
      setStatus("❌ Invalid Key. Barrier remains closed.");
      return;
    }

    setLoading(true);
    setStatus("Verifying slot authorization...");

    setTimeout(() => {
      setLoading(false);
      setActiveStep(14);
      setStatus("Step 14: Slot verification successful! Lowering barrier...");
      setIsSlotOpen(true);
      addAlert("Slot barrier opened", "success");
      setEnteredKey("");

      setTimeout(() => {
        setStep(4);
        setActiveStep(15);
        setStatus("Step 15: Vehicle parked safely.");
        // Move car INTO the slot box
        const slotIdx = slotList.indexOf(slot);
        const targetX = 54 + (slotIdx * 10);
        setCarPos({ x: targetX, y: 25 });
        setCarRotation(0);
        addAlert("Parking completed", "success");

        setTimeout(() => {
          setActiveStep(16);
          setIsTimerRunning(true);
          setStatus("Step 16: Parking session active. Timer running.");
          addAlert("Timer started", "info");
          
          setTimeout(() => {
            setActiveStep(17);
            addAlert("System alerts active & monitored", "info");
          }, 1500);
        }, 1500);
      }, 2000);
    }, 1000);
  };

  const handleExit = async () => {
    setActiveStep(18);
    setStatus("Step 18: Initiating exit. Releasing slot " + slot + "...");
    setIsTimerRunning(false);
    
    try {
      await axios.post('http://localhost:5000/api/booking/checkout', { uniqueKey: key });
      setIsSlotOpen(true);
      setTimeout(() => {
        setCarRotation(90);
        setCarPos({ x: carPos.x, y: 50 });
        setTimeout(() => {
          setCarRotation(180);
          setCarPos({ x: 120, y: 50 });
          setStep(5);
          setStatus("Thank you! Visit again.");
          addAlert("Vehicle exited", "info");
        }, 2000);
      }, 1500);
    } catch (err) {
      addAlert("Exit system failure", "error");
    }
  };

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="main-content flex-grow-1 animate-fade-in" style={{ padding: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        
        {/* Left Side: Visual Simulation */}
        <div className="simulation-visual-area">
          <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
            <div>
              <h2 className="dashboard-title">
                <span className="gradient-text">{isOverflow ? 'Extended' : 'Mall'}</span> Operations
              </h2>
              <p className="dashboard-subtitle">
                {isOverflow ? `Secured Overflow Area: ${parkLocation}` : `Assigned Mall Slot: ${slot}`}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Verification Mode</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700' }}>
                {isOverflow ? 'SINGLE GATE ENTRY' : 'DUAL-STAGE BARRIER'}
              </div>
            </div>
            {isTimerRunning && (
              <div className="capacity-badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', padding: '0.5rem 1rem' }}>
                <Clock size={16} /> <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: '800' }}>{formatTime(timer)}</span>
              </div>
            )}
          </div>

          <div style={{ 
            height: '420px', 
            background: '#020617', 
            borderRadius: '24px', 
            position: 'relative', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
          }}>
            {/* Roads Layout */}
            <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '100px', background: 'rgba(255,255,255,0.01)', transform: 'translateY(-50%)', borderTop: '1px dashed rgba(255,255,255,0.05)', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}></div>
            
            {/* Main Entrance Gate Area */}
            <div style={{ position: 'absolute', left: '20%', top: '0', bottom: '0', width: '2px', background: 'rgba(255,255,255,0.05)' }}>
              {/* Barrier Arm */}
              <div style={{ 
                position: 'absolute', top: '50%', left: '0', 
                width: '100px', height: '8px', 
                background: isGateOpen ? '#10b981' : '#ef4444', 
                borderRadius: '8px',
                transformOrigin: 'left',
                transform: `translateY(-40px) rotate(${isGateOpen ? '-90' : '0'}deg)`,
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 20px ${isGateOpen ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`
              }}></div>
            </div>

            {/* Slots Area / Open Zone */}
            <div style={{ position: 'absolute', top: '15%', left: '45%', right: '5%', bottom: '15%' }}>
              {!isOverflow ? (
                <div style={{ display: 'flex', gap: '30px' }}>
                  {slotList.map(s => (
                    <div key={s} style={{ 
                      width: '70px', height: '110px', 
                      border: `2px solid ${s === slot ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                      background: s === slot ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                      borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '1.2rem', color: s === slot ? 'var(--primary)' : '#1e293b',
                      position: 'relative',
                      boxShadow: s === slot ? '0 0 20px rgba(59,130,246,0.2)' : 'none'
                    }}>
                      {s}
                      {/* Slot Barrier Arm */}
                      {s === slot && (
                    <div style={{ 
                      position: 'absolute', bottom: '0', left: '0', 
                      width: '100%', height: '12px', 
                      background: isSlotOpen ? 'transparent' : 'rgba(245, 158, 11, 0.2)',
                      borderRadius: '0 0 12px 12px',
                      zIndex: 60
                    }}>
                      {/* Barrier Post */}
                      <div style={{ position: 'absolute', bottom: '0', left: '-5px', width: '10px', height: '20px', background: '#334155', borderRadius: '4px' }}></div>
                      
                      {/* Rotating Arm */}
                      <div style={{ 
                        position: 'absolute', bottom: '2px', left: '0', 
                        width: '70px', height: '8px', 
                        background: isSlotOpen ? '#10b981' : '#f59e0b',
                        borderRadius: '10px',
                        transformOrigin: 'left',
                        transform: `rotate(${isSlotOpen ? '-90' : '0'}deg)`,
                        transition: 'all 0.8s ease-in-out',
                        boxShadow: isSlotOpen ? '0 0 15px rgba(16,185,129,0.8)' : '0 0 15px rgba(245,158,11,0.5)',
                        border: '1px solid rgba(0,0,0,0.3)'
                      }}>
                        {!isSlotOpen && (
                          <span style={{ 
                            position: 'absolute', top: '-18px', right: '0', 
                            fontSize: '0.6rem', color: '#f59e0b', fontWeight: '900', 
                            whiteSpace: 'nowrap', textShadow: '0 0 5px black',
                            animation: 'pulse 1s infinite'
                          }}>
                            LOCKED GATE
                          </span>
                        )}
                      </div>
                    </div>
                      )}
                      {activeStep >= 15 && s === slot && (
                        <div style={{ position: 'absolute', top: '20%', fontSize: '2rem' }}>🅿️</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: '2px dashed rgba(16, 185, 129, 0.3)', 
                  borderRadius: '24px',
                  background: 'rgba(16, 185, 129, 0.02)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Grid of spots to show "large space" */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(8, 1fr)', 
                    gap: '15px', 
                    padding: '20px',
                    width: '100%',
                    height: '100%',
                    opacity: 0.1
                  }}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} style={{ border: '1px solid white', borderRadius: '4px', height: '40px' }}></div>
                    ))}
                  </div>
                  
                  <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 10px #10b981)' }}>🅿️</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#10b981' }}>
                      Large Secure Zone
                    </h3>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8, color: 'white' }}>Park anywhere in Sector C or D</p>
                    <div style={{ marginTop: '1rem', padding: '0.4rem 1rem', border: '1px solid #10b981', borderRadius: '20px', fontSize: '0.65rem', color: '#10b981', fontWeight: '700' }}>
                      SINGLE VERIFICATION ACCESS
                    </div>
                  </div>
                  
                  {/* Route Indicator Arrow */}
                  {activeStep === 11 && (
                    <div className="animate-pulse" style={{ position: 'absolute', bottom: '20%', left: '50%', color: 'var(--primary)', transform: 'rotate(-45deg)' }}>
                      <ArrowRight size={48} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* The Car */}
            <div style={{ 
              position: 'absolute', 
              left: `${carPos.x}%`, 
              top: `${carPos.y}%`, 
              transition: 'all 2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontSize: '3.5rem',
              zIndex: 50,
              transform: `translate(-50%, -50%) rotate(${carRotation}deg)`,
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
            }}>
              🚗
            </div>

            {/* Status Tooltip Overlay */}
            <div style={{ 
              position: 'absolute', bottom: '30px', left: '30px', 
              padding: '1rem 1.5rem', background: 'rgba(15, 23, 42, 0.8)', 
              backdropFilter: 'blur(10px)', borderRadius: '16px', 
              border: '1px solid rgba(255,255,255,0.1)',
              maxWidth: '300px'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>System Log</div>
              <div style={{ fontSize: '1rem', color: 'white', fontWeight: '600' }}>{status}</div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            {step === 0 && (
              <button 
                className="btn btn-primary" 
                style={{ padding: '1rem 4rem', fontSize: '1.2rem', borderRadius: '50px', boxShadow: '0 10px 30px var(--primary-glow)' }}
                onClick={handleStart}
              >
                Initiate Simulation Flow <ArrowRight size={20} />
              </button>
            )}

            {(activeStep === 9 || activeStep === 13) && (
              <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px', animation: 'slideUp 0.5s ease' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                  <Key className="gradient-text" /> 
                  {activeStep === 9 ? 'Main Entrance Terminal' : `Slot ${slot} Terminal`}
                </h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={enteredKey}
                    onChange={(e) => setEnteredKey(e.target.value)}
                    placeholder="Enter Key (e.g. ABC-123)"
                    style={{ flex: 1, fontSize: '1.5rem', padding: '1rem', letterSpacing: '4px', textAlign: 'center' }}
                    autoFocus
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={activeStep === 9 ? handleVerifyMainGate : handleVerifySlotGate}
                    disabled={loading || !enteredKey}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Enter'}
                  </button>
                </div>
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Hint: Your key is <strong>{key}</strong>
                </p>
              </div>
            )}

            {activeStep >= 15 && activeStep < 18 && (
              <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '1rem 3rem' }} onClick={handleExit}>
                Initiate Automated Exit
              </button>
            )}

            {step === 5 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--success)', marginBottom: '1rem' }}>
                  <CheckCircle2 size={32} />
                  <h3 style={{ fontSize: '1.5rem' }}>Flow Completed Successfully</h3>
                </div>
                <button className="btn btn-outline" onClick={() => window.location.reload()}>Restart Simulation</button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Log & Alerts */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>System Checklist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map(s => (
              <div key={s.id} style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                color: activeStep >= s.id ? 'var(--success)' : (activeStep === s.id - 1 ? 'var(--text-main)' : '#475569'),
                fontSize: '0.85rem'
              }}>
                <div style={{ 
                  width: '20px', height: '20px', borderRadius: '50%', background: activeStep >= s.id ? 'var(--success-bg)' : 'transparent',
                  border: `1px solid ${activeStep >= s.id ? 'var(--success)' : '#1e293b'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {activeStep >= s.id ? <CheckCircle2 size={12} /> : s.icon}
                </div>
                <span style={{ textDecoration: activeStep > s.id ? 'line-through' : 'none' }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <Bell size={14} /> LIVE ALERTS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.map((a, i) => (
                <div key={i} style={{ 
                  padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                  background: a.type === 'error' ? 'rgba(239,68,68,0.1)' : (a.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)')
                }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{a.time}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '500' }}>{a.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
