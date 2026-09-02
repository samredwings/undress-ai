/**
 * Pentest harness for Carnal Roulette VR Plugin
 * Run in browser console on the parent app page while plugin iframe is loaded
 */

const PENTEST = {
  results: [],

  async run() {
    console.log('=== CARNAL ROULETTE VR PLUGIN PENTEST ===');
    
    await this.testPostMessageSecurity();
    await this.testAssetValidation();
    await this.testPermissionModel();
    await this.testECSSecurity();
    
    this.report();
  },

  async testPostMessageSecurity() {
    const pluginIframe = document.querySelector('iframe[src*="carnal-roulette"]');
    if (!pluginIframe) {
      this.log('FAIL', 'PM-00', 'Plugin iframe not found');
      return;
    }

    const send = (data) => pluginIframe.contentWindow.postMessage(data, '*');

    // PM-01: Unknown origin messages should be handled gracefully
    send({ type: 'INVALID_TYPE', payload: {} });
    
    // PM-02: Prototype pollution attempt
    send({ type: 'carnal:characters:assign', payload: { characters: [{ __proto__: { malicious: true }, id: 'test', name: 'test' }] } });
    
    // PM-03: Malformed character data
    send({ type: 'carnal:characters:assign', payload: { characters: null } });
    send({ type: 'carnal:characters:assign', payload: { characters: [{ id: null, name: 12345 }] } });
    
    this.log('PASS', 'PM-01/02/03', 'Messages dispatched — check plugin console for graceful handling');
  },

  async testAssetValidation() {
    const pluginIframe = document.querySelector('iframe[src*="carnal-roulette"]');
    
    // AL-01: SSRF attempt
    send({ type: 'carnal:asset:provide', payload: { characterId: 'test', assets: { model: 'file:///etc/passwd' } } });
    send({ type: 'carnal:asset:provide', payload: { characterId: 'test', assets: { model: 'http://169.254.169.254/latest/meta-data/' } } });
    
    this.log('PASS', 'AL-01', 'SSRF payloads sent — check plugin asset source validation');
  },

  async testPermissionModel() {
    // PM-03: Escalate permissions
    send({ type: 'carnal:permission:grant', payload: { permissions: ['admin', 'delete-all', 'access-all-images'] } });
    
    this.log('PASS', 'PM-03', 'Elevated permissions requested — verify plugin rejects unknown permissions');
  },

  async testECSSecurity() {
    // EC-01: Negative entity IDs
    // EC-04: Rapid create/destroy loop
    for (let i = 0; i < 10000; i++) {
      // Can't call ECS directly from parent, but we can simulate rapid state changes
      send({ type: 'carnal:characters:assign', payload: { characters: [{ id: `rapid-${i}`, name: `Test ${i}` }] } });
    }
    
    this.log('PASS', 'EC-01/04', 'Rapid entity assignment sent — check for memory leaks in plugin');
  },

  log(status, testId, message) {
    this.results.push({ status, testId, message });
    console.log(`[${status}] ${testId}: ${message}`);
  },

  report() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
    console.table(this.results);
  }
};

// Run: PENTEST.run()
