/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../scripts/utils.js';

document.body.innerHTML = await readFile({ path: './mocks/body.html' });

const { default: init } = await import('../../../blocks/blog-table-of-contents/blog-table-of-contents.js');

describe('table-of-contents block', () => {
  before(() => {
    setLibs('https://milo.adobe.com/libs');
  });

  it('should initialize the blog-table-of-contents modal block', async () => {
    const block = document.querySelector('.table-of-contents');
    await init(block);

    const intro = block.querySelector('#in-this-article');
    expect(intro).to.exist;
    const list = block.querySelector('ol');
    expect(list).to.exist;
    const listItems = list.querySelectorAll('li');
    expect(listItems.length).to.equal(3);
    const link0 = listItems[0].querySelector('a');
    expect(link0.textContent).to.equal('It all starts with Paragraph Styles');
    expect(link0.href).to.equal('http://localhost:2000/#it-all-starts-with-paragraph-styles');
    const link1 = listItems[1].querySelector('a');
    expect(link1.textContent).to.equal('Creating a table of contents');
    expect(link1.href).to.equal('http://localhost:2000/#creating-a-table-of-contents');
    const link2 = listItems[2].querySelector('a');
    expect(link2.textContent).to.equal('Conclusion');
    expect(link2.href).to.equal('http://localhost:2000/#conclusion');
  });
});
