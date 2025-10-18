type Observer = (event?: any) => void;

class MockYMap {
  private data = new Map<string, any>();
  private observers = new Set<Observer>();

  get(key: string) {
    return this.data.get(key);
  }
  set(key: string, value: any) {
    this.data.set(key, value);
    this.emitChange({ keys: new Map([[key, true]]), target: this });
  }
  delete(key: string) {
    this.data.delete(key);
    this.emitChange({ keys: new Map([[key, true]]), target: this });
  }
  toJSON() {
    const obj: Record<string, any> = {};
    this.data.forEach((v, k) => (obj[k] = v));
    return obj;
  }
  observe(cb: Observer) {
    this.observers.add(cb);
  }
  unobserve(cb: Observer) {
    this.observers.delete(cb);
  }
  private emitChange(evt: any) {
    this.observers.forEach(cb => cb(evt));
  }
}

class MockYDoc {
  private maps = new Map<string, MockYMap>();
  getMap(name: string) {
    if (!this.maps.has(name)) this.maps.set(name, new MockYMap());
    return this.maps.get(name)!;
  }
  destroy() {
    this.maps.clear();
  }
}

class MockAwareness {
  private local: any = {};
  private states = new Map<number, any>();
  private handlers = new Set<() => void>();

  setLocalStateField(key: string, value: any) {
    this.local[key] = value;
    // synthetic local state entry id 9999
    this.states.set(9999, { user: value });
    this.emitChange();
  }
  getLocalState() {
    return this.local;
  }
  getStates() {
    return this.states;
  }
  on(ev: string, cb: () => void) {
    this.handlers.add(cb);
  }
  off(ev: string, cb: () => void) {
    this.handlers.delete(cb);
  }
  emitChange() {
    this.handlers.forEach(h => h());
  }
}

class MockProvider {
  public awareness = new MockAwareness();
  public wsconnected = true;
  public synced = true;
  private handlers = new Map<string, ((...args: any[]) => void)[]>();

  on(event: string, cb: (...a: any[]) => void) {
    const arr = this.handlers.get(event) || [];
    arr.push(cb);
    this.handlers.set(event, arr);
  }
  off(event: string, cb: (...a: any[]) => void) {
    const arr = (this.handlers.get(event) || []).filter(f => f !== cb);
    this.handlers.set(event, arr);
  }
  disconnect() {
    this.wsconnected = false;
    const ev = this.handlers.get("connection-close") || [];
    ev.forEach(cb => cb());
  }
  
  emit(event: string, ...args: any[]) {
    (this.handlers.get(event) || []).forEach(cb => cb(...args));
  }
}

export { MockYMap, MockYDoc, MockAwareness, MockProvider };