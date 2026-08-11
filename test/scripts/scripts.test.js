/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { expect } from '@esm-bundle/chai';
import {
  getRegionCookie,
  persistRegionFromPath,
  applyRegionGnavOverride,
  REGION_COOKIE,
} from '../../scripts/utils.js';

function goTo(pathname) {
  window.history.pushState(null, '', pathname);
}

function clearRegionCookie() {
  document.cookie = `${REGION_COOKIE}=; path=/; max-age=0`;
}

function setGnavSourceMeta(content) {
  let meta = document.head.querySelector('meta[name="gnav-source"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'gnav-source');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
  return meta;
}

describe('region gnav persistence', () => {
  afterEach(() => {
    clearRegionCookie();
    document.head.querySelector('meta[name="gnav-source"]')?.remove();
  });

  describe('persistRegionFromPath', () => {
    it('sets the region cookie when landing on /en/uk', () => {
      goTo('/en/uk');
      persistRegionFromPath();
      expect(getRegionCookie()).to.equal('uk');
    });

    it('sets the region cookie when landing on /en/apac', () => {
      goTo('/en/apac');
      persistRegionFromPath();
      expect(getRegionCookie()).to.equal('apac');
    });

    it('sets the region cookie for nested paths under /en/uk/', () => {
      goTo('/en/uk/some-section');
      persistRegionFromPath();
      expect(getRegionCookie()).to.equal('uk');
    });

    it('clears the region cookie when landing on the bare US root "/"', () => {
      document.cookie = `${REGION_COOKIE}=uk; path=/`;
      goTo('/');
      persistRegionFromPath();
      expect(getRegionCookie()).to.be.null;
    });

    it('leaves an existing cookie untouched on unrelated pages', () => {
      document.cookie = `${REGION_COOKIE}=uk; path=/`;
      goTo('/en/publish/2026/01/01/some-story');
      persistRegionFromPath();
      expect(getRegionCookie()).to.equal('uk');
    });
  });

  describe('applyRegionGnavOverride', () => {
    it('overrides gnav-source to /gnav-old on an article page when the uk cookie is set', () => {
      document.cookie = `${REGION_COOKIE}=uk; path=/`;
      const meta = setGnavSourceMeta('/gnav');
      goTo('/en/publish/2026/01/01/some-story');
      applyRegionGnavOverride();
      expect(meta.getAttribute('content')).to.equal('/gnav-old');
    });

    it('overrides gnav-source on a topic page when the apac cookie is set', () => {
      document.cookie = `${REGION_COOKIE}=apac; path=/`;
      const meta = setGnavSourceMeta('/gnav');
      goTo('/en/topics/news');
      applyRegionGnavOverride();
      expect(meta.getAttribute('content')).to.equal('/gnav-old');
    });

    it('does nothing when no region cookie is set', () => {
      const meta = setGnavSourceMeta('/gnav');
      goTo('/en/publish/2026/01/01/some-story');
      applyRegionGnavOverride();
      expect(meta.getAttribute('content')).to.equal('/gnav');
    });

    it('does not override on a page already scoped to /en/uk', () => {
      document.cookie = `${REGION_COOKIE}=uk; path=/`;
      const meta = setGnavSourceMeta('/gnav-old');
      goTo('/en/uk');
      applyRegionGnavOverride();
      expect(meta.getAttribute('content')).to.equal('/gnav-old');
    });

    it('does not override pages outside the /en/ tree', () => {
      document.cookie = `${REGION_COOKIE}=uk; path=/`;
      const meta = setGnavSourceMeta('/gnav');
      goTo('/de/some-page');
      applyRegionGnavOverride();
      expect(meta.getAttribute('content')).to.equal('/gnav');
    });

    it('is a no-op when there is no gnav-source meta tag on the page', () => {
      document.cookie = `${REGION_COOKIE}=uk; path=/`;
      goTo('/en/publish/2026/01/01/some-story');
      expect(() => applyRegionGnavOverride()).to.not.throw();
    });
  });
});
