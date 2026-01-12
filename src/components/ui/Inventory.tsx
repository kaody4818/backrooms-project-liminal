import { useGameStore } from '../../store/gameStore';

export const Inventory = () => {
    const { inventory, isInventoryOpen, setInventoryOpen, useItem } = useGameStore();

    if (!isInventoryOpen) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200, // Above other UI
            color: '#fff',
            fontFamily: '"Courier New", Courier, monospace',
        }}>
            <div style={{
                width: '80%',
                maxWidth: '800px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(0,0,0,0.8)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid #333',
                    paddingBottom: '10px'
                }}>
                    <h2 style={{ margin: 0, fontSize: '24px', color: '#ccc' }}>INVENTORY</h2>
                    <button
                        onClick={() => {
                            setInventoryOpen(false);
                            useGameStore.getState().setPaused(false);
                            window.dispatchEvent(new Event('request-game-lock'));
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            fontSize: '24px',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {inventory.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                        <p>No items collected.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '15px',
                        maxHeight: '60vh',
                        overflowY: 'auto'
                    }}>
                        {inventory.map((item) => (
                            <div key={item.id} style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                                    {item.icon || '📦'}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                                    x{item.quantity}
                                </div>
                                <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px', flex: 1 }}>
                                    {item.description}
                                </div>

                                {item.id === 'almond_water' && (
                                    <button
                                        onClick={() => useItem(item.id)}
                                        style={{
                                            backgroundColor: '#4a3a2a',
                                            color: '#eec',
                                            border: '1px solid #864',
                                            borderRadius: '3px',
                                            padding: '4px 8px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            textTransform: 'uppercase'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6b543a'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a3a2a'}
                                    >
                                        USE
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: '20px', textAlign: 'center', color: '#555', fontSize: '12px' }}>
                    Press TAB to close
                </div>
            </div>
        </div>
    );
};
