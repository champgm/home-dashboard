import { HomeDashboardPage } from './app.po';

describe('home-dashboard App', () => {
  let page: HomeDashboardPage;

  beforeEach(() => {
    page = new HomeDashboardPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
