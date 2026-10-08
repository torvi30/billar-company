import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Check, User, Users, CircleDot, Tag, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { sounds } from '../utils/audio';
import { api } from '../services/api';

export default function SpeedPOSModal({ table, isOpen, onClose, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeTarget, setActiveTarget] = useState('Mesa');
  const [customTargetName, setCustomTargetName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [cart, setCart] = useState({}); // key: `${productId}_${target}` -> { productId, target, quantity }
  const [loading, setLoading] = useState(false);

  const p1Name = (table && table.score && table.score.player1_name) || 'Jugador 1';
  const p2Name = (table && table.score && table.score.player2_name) || 'Jugador 2';

  useEffect(() => {
    if (isOpen) {
      setCart({});
      setActiveTarget('Mesa');
      setShowCustomInput(false);
      setCustomTargetName('');
      api.getProducts().then(res => {
        if (res.success) setProducts(res.data);
      });
    }
  }, [isOpen]);

  if (!isOpen || !table) return null;

  const categories = ['Todas', ...new Set(products.map(p => p.category))];
  const filteredProducts = selectedCategory === 'Todas' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const targetsList = table.type === 'barra'
    ? [
        { id: 'Mesa', label: '🍺 Cuenta General', color: 'var(--color-brand)' }
      ]
    : [
        { id: 'Mesa', label: '🎱 Mesa (General)', color: 'var(--color-brand)' },
        { id: p1Name, label: `👤 ${p1Name}`, color: 'var(--color-blue)' },
        { id: p2Name, label: `👤 ${p2Name}`, color: 'var(--color-gold)' }
      ];

  const currentEffectiveTarget = showCustomInput && customTargetName.trim() 
    ? customTargetName.trim() 
    : activeTarget;

  const updateQuantity = (productId, target, delta) => {
    const prod = products.find(p => p.id === productId);
    if (delta > 0 && prod) {
      const currentInCart = Object.values(cart)
        .filter(entry => entry.productId === productId)
        .reduce((sum, entry) => sum + entry.quantity, 0);

      if (currentInCart + delta > prod.stock) {
        sounds.playScoreBeep(false);
        alert(`⚠️ Stock insuficiente: solo quedan ${prod.stock} unidades disponibles de "${prod.name}"`);
        return;
      }
    }

    sounds.playScoreBeep(delta > 0);
    const key = `${productId}_${target}`;
    setCart(prev => {
      const existing = prev[key];
      const currentQty = existing ? existing.quantity : 0;
      const nextQty = Math.max(0, currentQty + delta);
      const copy = { ...prev };
      if (nextQty === 0) {
        delete copy[key];
      } else {
        copy[key] = {
          productId,
          target,
          quantity: nextQty
        };
      }
      return copy;
    });
  };

  const cartEntries = Object.values(cart).map(entry => {
    const prod = products.find(p => p.id === entry.productId);
    return {
      product: prod,
      target: entry.target,
      quantity: entry.quantity,
      subtotal: (prod ? prod.price : 0) * entry.quantity
    };
  }).filter(entry => entry.product != null);

  const totalCart = cartEntries.reduce((acc, item) => acc + item.subtotal, 0);

  // Group cart items by target for summary
  const subtotalByTarget = cartEntries.reduce((acc, item) => {
    acc[item.target] = (acc[item.target] || 0) + item.subtotal;
    return acc;
  }, {});

  const handleConfirmOrder = async () => {
    if (cartEntries.length === 0) return;
    setLoading(true);
    try {
      sounds.playCashRegister();
      const payload = cartEntries.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        assignedTo: i.target
      }));
      await api.addOrder(table.current_session.id, payload, activeTarget);
      onSuccess();
      onClose();
    } catch (e) {
      alert(e.message || 'Error al agregar productos');
    } finally {
      setLoading(false);
    }
  };

  // Switch an item's target in the cart
  const cycleTargetForItem = (entry) => {
    const available = ['Mesa', p1Name, p2Name];
    const currentIndex = available.indexOf(entry.target);
    const nextTarget = currentIndex >= 0 && currentIndex < available.length - 1 
      ? available[currentIndex + 1] 
      : available[0];
    
    setCart(prev => {
      const oldKey = `${entry.product.id}_${entry.target}`;
      const newKey = `${entry.product.id}_${nextTarget}`;
      const copy = { ...prev };
      delete copy[oldKey];
      const newQty = (copy[newKey]?.quantity || 0) + entry.quantity;
      copy[newKey] = {
        productId: entry.product.id,
        target: nextTarget,
        quantity: newQty
      };
      return copy;
    });
  };

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 14, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        cursor: 'pointer'
      }}
    >
      <div 
        className="glass-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          cursor: 'default'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {table.type === 'barra' ? `Cargar Consumo: ${table.name}` : `Cargar Consumo a Mesa ${table.table_number}`}
              </h2>
              <span style={{
                background: 'rgba(0, 230, 118, 0.15)',
                color: 'var(--color-brand)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}>
                Speed-POS
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Selecciona a quién cargar cada consumo: a la mesa compartida o a un jugador en específico.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              padding: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Assignee Selector Bar */}
        <div style={{
          padding: '0.75rem 1.75rem',
          background: 'rgba(0, 0, 0, 0.35)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Cargar consumo a:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {targetsList.map(t => {
              const isSelected = !showCustomInput && activeTarget === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setShowCustomInput(false);
                    setActiveTarget(t.id);
                  }}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    background: isSelected ? t.color : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#090d16' : '#fff',
                    border: `1px solid ${isSelected ? t.color : 'var(--border-subtle)'}`,
                    boxShadow: isSelected ? `0 0 12px ${t.color}40` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              );
            })}

            {/* Custom target toggle */}
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-secondary)',
                  border: '1px dashed var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                + Otro Jugador/Nombre
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Nombre de la persona..."
                  value={customTargetName}
                  onChange={(e) => setCustomTargetName(e.target.value)}
                  autoFocus
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#090d16',
                    border: '1px solid var(--color-purple)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    width: '160px'
                  }}
                />
                <button
                  onClick={() => {
                    if (!customTargetName.trim()) setShowCustomInput(false);
                  }}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: 'var(--color-purple)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  OK
                </button>
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Destino activo: <strong style={{ color: '#fff' }}>{currentEffectiveTarget}</strong>
          </div>
        </div>

        {/* Modal Body: Products on Left, Cart on Right */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1.4fr',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Left: Product Selector */}
          <div style={{
            padding: '1.25rem',
            overflowY: 'auto',
            borderRight: '1px solid var(--border-subtle)'
          }}>
            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: selectedCategory === cat ? 'var(--color-brand)' : 'rgba(255, 255, 255, 0.05)',
                    color: selectedCategory === cat ? '#090d16' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.75rem'
            }}>
              {filteredProducts.map(p => {
                const threshold = p.min_stock != null ? p.min_stock : 10;
                const isOutStock = p.stock <= 0;
                const isLowStock = p.stock <= threshold && !isOutStock;

                // Calculate total in cart for this product across all targets
                const inCartTotal = cartEntries
                  .filter(e => e.product.id === p.id)
                  .reduce((sum, e) => sum + e.quantity, 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isOutStock) {
                        sounds.playScoreBeep(false);
                        alert(`El producto "${p.name}" se encuentra agotado.`);
                        return;
                      }
                      updateQuantity(p.id, currentEffectiveTarget, 1);
                    }}
                    style={{
                      background: inCartTotal > 0 
                        ? 'rgba(0, 230, 118, 0.08)' 
                        : isOutStock 
                        ? 'rgba(244, 63, 94, 0.05)' 
                        : isLowStock ? 'rgba(251, 191, 36, 0.04)' : 'var(--bg-surface)',
                      border: `1px solid ${
                        inCartTotal > 0 
                          ? 'var(--color-brand)' 
                          : isOutStock 
                          ? 'rgba(244, 63, 94, 0.3)' 
                          : isLowStock ? 'rgba(251, 191, 36, 0.4)' : 'var(--border-subtle)'
                      }`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      cursor: isOutStock ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '110px',
                      position: 'relative',
                      opacity: isOutStock ? 0.6 : 1,
                      transition: 'transform 0.1s, border-color 0.1s'
                    }}
                  >
                    {inCartTotal > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: 'var(--color-brand)',
                        color: '#090d16',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        zIndex: 2
                      }}>
                        {inCartTotal}
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          {p.category}
                        </span>
                        {/* Stock indicator badge */}
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: isOutStock 
                            ? 'rgba(244, 63, 94, 0.2)' 
                            : isLowStock ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          color: isOutStock 
                            ? 'var(--color-alert)' 
                            : isLowStock ? 'var(--color-gold)' : 'var(--text-secondary)'
                        }}>
                          {isOutStock ? '⛔ Agotado' : isLowStock ? `⚠️ Quedan ${p.stock}` : `${p.stock} disp.`}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '4px', lineHeight: 1.2 }}>
                        {p.name}
                      </div>
                    </div>

                    <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-gold)', marginTop: '0.5rem' }}>
                      {formatCurrency(p.price)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Cart Summary */}
          <div style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 22, 0.4)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={18} color="var(--color-brand)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Comanda a Cargar
                  </h3>
                </div>
                {cartEntries.length > 0 && (
                  <button
                    onClick={() => setCart({})}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-alert)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {cartEntries.length === 0 ? (
                <div style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  Selecciona a quién cargar arriba y pulsa sobre los productos para agregarlos a la comanda.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {cartEntries.map((entry, idx) => {
                    const isMesa = entry.target === 'Mesa';
                    const isP1 = entry.target === p1Name;
                    const badgeColor = isMesa 
                      ? 'var(--color-brand)' 
                      : isP1 ? 'var(--color-blue)' : 'var(--color-gold)';

                    return (
                      <div
                        key={`${entry.product.id}_${entry.target}_${idx}`}
                        style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.6rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                              {entry.product.name}
                            </span>
                            {/* Target Pill with quick-cycle on click */}
                            <button
                              onClick={() => cycleTargetForItem(entry)}
                              title="Haz clic para reasignar a otro jugador o a la mesa"
                              style={{
                                background: `${badgeColor}20`,
                                color: badgeColor,
                                border: `1px solid ${badgeColor}50`,
                                borderRadius: 'var(--radius-full)',
                                padding: '1px 7px',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              {entry.target === 'Mesa' ? '🎱 Mesa' : `👤 ${entry.target}`}
                              <span style={{ opacity: 0.6 }}>⇄</span>
                            </button>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {formatCurrency(entry.product.price)} c/u
                          </div>
                        </div>

                        {/* Quantity stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            onClick={() => updateQuantity(entry.product.id, entry.target, -1)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              width: '26px',
                              height: '26px',
                              borderRadius: '4px'
                            }}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>
                            {entry.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(entry.product.id, entry.target, 1)}
                            style={{
                              background: 'var(--color-brand)',
                              color: '#090d16',
                              width: '26px',
                              height: '26px',
                              borderRadius: '4px'
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="mono" style={{ width: '80px', textAlign: 'right', fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-gold)' }}>
                          {formatCurrency(entry.subtotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Breakdown & Confirm Action */}
            <div style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.85rem',
              marginTop: '0.85rem'
            }}>
              {/* Itemized target chips summary if multiple targets */}
              {cartEntries.length > 0 && Object.keys(subtotalByTarget).length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.75rem',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem'
                }}>
                  {Object.entries(subtotalByTarget).map(([t, amount]) => (
                    <span key={t} style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong style={{ color: '#fff' }}>{t}:</strong> {formatCurrency(amount)}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Comanda:</span>
                <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  {formatCurrency(totalCart)}
                </span>
              </div>

              <button
                disabled={cartEntries.length === 0 || loading}
                onClick={handleConfirmOrder}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: 'var(--radius-md)',
                  background: cartEntries.length > 0 ? 'var(--color-brand)' : 'var(--border-subtle)',
                  color: cartEntries.length > 0 ? '#090d16' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  gap: '0.5rem',
                  cursor: cartEntries.length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: cartEntries.length > 0 ? 'var(--shadow-neon-green)' : 'none'
                }}
              >
                <Check size={20} />
                {loading ? 'Cargando comanda...' : `Confirmar y Cargar a Mesa ${table.table_number}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
