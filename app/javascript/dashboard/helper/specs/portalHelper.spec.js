import { buildPortalArticleURL, buildPortalURL } from '../portalHelper';

describe('PortalHelper', () => {
  describe('buildPortalURL', () => {
    it('returns the correct url', () => {
      window.stravoxConfig = {
        hostURL: 'https://app.stravox.com',
        helpCenterURL: 'https://help.stravox.com',
      };
      expect(buildPortalURL('handbook')).toEqual(
        'https://help.stravox.com/hc/handbook'
      );
      window.stravoxConfig = {};
    });
  });

  describe('buildPortalArticleURL', () => {
    it('returns the correct url', () => {
      window.stravoxConfig = {
        hostURL: 'https://app.stravox.com',
        helpCenterURL: 'https://help.stravox.com',
      };
      expect(
        buildPortalArticleURL('handbook', 'culture', 'fr', 'article-slug')
      ).toEqual('https://help.stravox.com/hc/handbook/articles/article-slug');
      window.stravoxConfig = {};
    });

    it('returns the correct url with custom domain', () => {
      window.stravoxConfig = {
        hostURL: 'https://app.stravox.com',
        helpCenterURL: 'https://help.stravox.com',
      };
      expect(
        buildPortalArticleURL(
          'handbook',
          'culture',
          'fr',
          'article-slug',
          'custom-domain.dev'
        )
      ).toEqual('https://custom-domain.dev/hc/handbook/articles/article-slug');
    });

    it('handles https in custom domain correctly', () => {
      window.stravoxConfig = {
        hostURL: 'https://app.stravox.com',
        helpCenterURL: 'https://help.stravox.com',
      };
      expect(
        buildPortalArticleURL(
          'handbook',
          'culture',
          'fr',
          'article-slug',
          'https://custom-domain.dev'
        )
      ).toEqual('https://custom-domain.dev/hc/handbook/articles/article-slug');
    });

    it('uses hostURL when helpCenterURL is not available', () => {
      window.stravoxConfig = {
        hostURL: 'https://app.stravox.com',
        helpCenterURL: '',
      };
      expect(
        buildPortalArticleURL('handbook', 'culture', 'fr', 'article-slug')
      ).toEqual('https://app.stravox.com/hc/handbook/articles/article-slug');
    });
  });
});
