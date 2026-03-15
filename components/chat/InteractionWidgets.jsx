import React, { useState, useRef } from 'react';

// ═══════════════════════════════════════════════
// SLIDER
// ═══════════════════════════════════════════════

export function SliderWidget({ config, onSubmit }) {
  const [value, setValue] = useState(config.default || 0.5);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const updateValue = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const newVal = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setValue(newVal);
  };

  const onPointerDown = (e) => {
    dragging.current = true;
    updateValue(e.clientX || e.touches?.[0]?.clientX);

    const onMove = (ev) => {
      if (dragging.current) {
        updateValue(ev.clientX || ev.touches?.[0]?.clientX);
      }
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  if (showCustom) {
    return (
      <>
        <textarea
          className="pl-custom-input"
          placeholder="Tell me in your own words..."
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          autoFocus
        />
        <div className="pl-interaction-submit">
          <button
            className="pl-btn-dark"
            disabled={!customText.trim()}
            onClick={() =>
              onSubmit({ selected: 'custom', custom_text: customText.trim() })
            }
          >
            Send
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pl-slider-labels">
        <span>{config.left}</span>
        <span>{config.right}</span>
      </div>
      <div
        className="pl-slider-track"
        ref={trackRef}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
      >
        <div className="pl-slider-fill" style={{ width: `${value * 100}%` }} />
        <div className="pl-slider-thumb" style={{ left: `${value * 100}%` }} />
      </div>
      {config.allow_custom && (
        <button className="pl-escape" onClick={() => setShowCustom(true)}>
          Neither — let me explain
        </button>
      )}
      <div className="pl-interaction-submit">
        <button className="pl-btn-dark" onClick={() => onSubmit({ value })}>
          Submit
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// SINGLE SELECT
// ═══════════════════════════════════════════════

export function SingleSelectWidget({ config, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  if (showCustom) {
    return (
      <>
        <textarea
          className="pl-custom-input"
          placeholder="Tell me in your own words..."
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          autoFocus
        />
        <div className="pl-interaction-submit">
          <button
            className="pl-btn-dark"
            disabled={!customText.trim()}
            onClick={() =>
              onSubmit({ selected: 'custom', custom_text: customText.trim() })
            }
          >
            Send
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {config.options.map((opt, i) => (
        <div
          key={i}
          className={`pl-choice ${selected === opt ? 'selected' : ''}`}
          onClick={() => setSelected(opt)}
        >
          {opt}
        </div>
      ))}
      {config.allow_custom && (
        <div
          className="pl-choice pl-choice-custom"
          onClick={() => setShowCustom(true)}
        >
          None of these — let me explain
        </div>
      )}
      <div className="pl-interaction-submit">
        <button
          className="pl-btn-dark"
          disabled={!selected}
          onClick={() => onSubmit({ selected })}
        >
          Submit
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// MULTI SELECT
// ═══════════════════════════════════════════════

export function MultiSelectWidget({ config, onSubmit }) {
  const [selected, setSelected] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const max = config.max_selections || 4;

  const toggle = (opt) => {
    if (selected.includes(opt)) {
      setSelected(selected.filter((s) => s !== opt));
    } else if (selected.length < max) {
      setSelected([...selected, opt]);
    }
  };

  return (
    <>
      {config.options.map((opt, i) => (
        <div
          key={i}
          className={`pl-choice ${selected.includes(opt) ? 'selected' : ''}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </div>
      ))}
      {config.allow_custom && (
        <>
          <button
            className="pl-escape"
            onClick={() => setShowCustom(!showCustom)}
          >
            {showCustom ? 'Hide' : 'Add your own'}
          </button>
          {showCustom && (
            <textarea
              className="pl-custom-input"
              placeholder="Tell me in your own words..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              autoFocus
            />
          )}
        </>
      )}
      <div className="pl-interaction-submit">
        <button
          className="pl-btn-dark"
          disabled={selected.length === 0 && !customText.trim()}
          onClick={() => {
            const sel =
              showCustom && customText.trim()
                ? [...selected, 'custom']
                : selected;
            onSubmit({ selected: sel, custom_text: customText.trim() });
          }}
        >
          Submit
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// FREE TEXT
// ═══════════════════════════════════════════════

export function FreeTextWidget({ config, onSubmit }) {
  const [text, setText] = useState('');

  return (
    <>
      <textarea
        className="pl-custom-input"
        placeholder={config?.placeholder || 'Type your response...'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      {config?.min_hint && (
        <p className="pl-mono-sm" style={{ marginTop: 4 }}>
          {config.min_hint}
        </p>
      )}
      <div className="pl-interaction-submit">
        <button
          className="pl-btn-dark"
          disabled={!text.trim()}
          onClick={() => onSubmit({ text: text.trim() })}
        >
          Send
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// INTERACTION WIDGET (dispatcher)
// ═══════════════════════════════════════════════

export default function InteractionWidget({ interaction, onSubmit }) {
  return (
    <div className="pl-interaction-panel">
      <div className="pl-interaction-q">{interaction.question}</div>
      {interaction.type === 'slider' && (
        <SliderWidget config={interaction.config} onSubmit={onSubmit} />
      )}
      {interaction.type === 'single_select' && (
        <SingleSelectWidget config={interaction.config} onSubmit={onSubmit} />
      )}
      {interaction.type === 'multi_select' && (
        <MultiSelectWidget config={interaction.config} onSubmit={onSubmit} />
      )}
      {interaction.type === 'free_text' && (
        <FreeTextWidget config={interaction.config} onSubmit={onSubmit} />
      )}
    </div>
  );
}
