// Critically damped Apple-style spring physics engine (apple-design §1, §3, §4, §14)
// Preserves live position and velocity on mid-flight retargeting.

const activeSprings = new Map();

function prefersReducedMotion() {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

function getNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function scheduleFrame(cb) {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(cb);
  }
  return setTimeout(() => cb(getNow()), 16);
}

function cancelFrame(id) {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}

export class SpringAnimator {
  static get activeAnimations() {
    return activeSprings;
  }

  static animateValue(
    key,
    fromValue,
    toValue,
    onUpdate,
    { damping = 1.0, response = 0.35, precision = 0.001, onComplete } = {}
  ) {
    const existing = activeSprings.get(key);
    const startValue = existing ? existing.value : Number(fromValue);
    const startVelocity = existing ? existing.velocity : 0;
    const target = Number(toValue);

    if (existing && existing.rafId) {
      cancelFrame(existing.rafId);
    }

    if (prefersReducedMotion() || Math.abs(target - startValue) <= precision) {
      activeSprings.set(key, { value: target, velocity: 0, target, rafId: null });
      if (typeof onUpdate === 'function') onUpdate(target);
      if (typeof onComplete === 'function') onComplete(target);
      return;
    }

    // Apple spring parameterization:
    // stiffness k = (2 * pi / response)^2, damping c = 4 * pi * damping / response
    const omega = (2 * Math.PI) / Math.max(0.05, response);
    const stiffness = omega * omega;
    const dampingCoeff = 2 * Math.max(0.1, damping) * omega;

    const state = {
      value: startValue,
      velocity: startVelocity,
      target,
      lastTime: getNow(),
      rafId: null
    };
    activeSprings.set(key, state);

    const step = (now) => {
      const dt = Math.min(0.064, Math.max(0.001, (now - state.lastTime) / 1000));
      state.lastTime = now;

      // Semi-implicit Euler integration with sub-stepping for stability
      const subSteps = 2;
      const subDt = dt / subSteps;
      for (let i = 0; i < subSteps; i++) {
        const displacement = state.value - state.target;
        const springForce = -stiffness * displacement;
        const dampingForce = -dampingCoeff * state.velocity;
        const acceleration = springForce + dampingForce;
        state.velocity += acceleration * subDt;
        state.value += state.velocity * subDt;
      }

      if (typeof onUpdate === 'function') {
        onUpdate(state.value);
      }

      const isSettled =
        Math.abs(state.target - state.value) <= precision &&
        Math.abs(state.velocity) <= precision * 10;

      if (isSettled) {
        state.value = state.target;
        state.velocity = 0;
        state.rafId = null;
        if (typeof onUpdate === 'function') onUpdate(state.target);
        if (typeof onComplete === 'function') onComplete(state.target);
      } else {
        state.rafId = scheduleFrame(step);
      }
    };

    state.rafId = scheduleFrame(step);
  }

  static animateNumber(
    el,
    targetValue,
    formatter = (v) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' }).format(Math.round(v)),
    options = {}
  ) {
    if (!el) return;
    const key = el.id || el.dataset?.springKey || `num_${Math.random().toString(36).slice(2)}`;
    if (!el.id && el.dataset) {
      el.dataset.springKey = key;
    }

    const currentNumeric =
      el._springCurrentValue !== undefined
        ? el._springCurrentValue
        : Number(String(el.textContent || '0').replace(/[^\d,-]/g, '').replace(',', '.')) || 0;

    const target = Number(targetValue) || 0;

    SpringAnimator.animateValue(
      `number:${key}`,
      currentNumeric,
      target,
      (val) => {
        el._springCurrentValue = val;
        el.textContent = formatter(val);
      },
      { damping: 1.0, response: 0.35, precision: 0.25, ...options }
    );
  }

  static movePillIndicator(pillEl, targetBtnEl, key = 'pill') {
    if (!pillEl || !targetBtnEl) return;
    const parent = pillEl.offsetParent || pillEl.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const btnRect = targetBtnEl.getBoundingClientRect();

    const targetLeft = btnRect.left - parentRect.left;
    const targetWidth = btnRect.width;

    const currentLeft =
      pillEl._springLeft !== undefined ? pillEl._springLeft : targetBtnEl.offsetLeft || 4;
    const currentWidth =
      pillEl._springWidth !== undefined ? pillEl._springWidth : targetWidth || 120;

    SpringAnimator.animateValue(
      `${key}:left`,
      currentLeft,
      targetLeft,
      (x) => {
        pillEl._springLeft = x;
        pillEl.style.transform = `translate3d(${x - 4}px, 0, 0)`;
      },
      { damping: 1.0, response: 0.32, precision: 0.2 }
    );

    SpringAnimator.animateValue(
      `${key}:width`,
      currentWidth,
      targetWidth,
      (w) => {
        pillEl._springWidth = w;
        pillEl.style.width = `${w}px`;
      },
      { damping: 1.0, response: 0.32, precision: 0.2 }
    );
  }

  static bindTactilePress(root = typeof document !== 'undefined' ? document : null) {
    if (!root || typeof root.addEventListener !== 'function') return;
    const selector = '.btn-apple, button, .interactive-card, .segmented-btn';

    const clearPress = (e) => {
      const target = e.target?.closest ? e.target.closest(selector) : null;
      if (target) target.classList.remove('is-pressing');
      if (typeof document !== 'undefined') {
        document.querySelectorAll('.is-pressing').forEach((el) => el.classList.remove('is-pressing'));
      }
    };

    root.addEventListener(
      'pointerdown',
      (e) => {
        const target = e.target?.closest ? e.target.closest(selector) : null;
        if (target && !target.disabled) {
          target.classList.add('is-pressing');
        }
      },
      { passive: true }
    );

    root.addEventListener('pointerup', clearPress, { passive: true });
    root.addEventListener('pointercancel', clearPress, { passive: true });
    root.addEventListener('pointerleave', clearPress, { passive: true });
  }

  animateValue(...args) {
    return SpringAnimator.animateValue(...args);
  }

  animateNumber(...args) {
    return SpringAnimator.animateNumber(...args);
  }

  movePillIndicator(...args) {
    return SpringAnimator.movePillIndicator(...args);
  }

  bindTactilePress(...args) {
    return SpringAnimator.bindTactilePress(...args);
  }
}

export default SpringAnimator;
