import { createQuery } from '../../support/redash-api';

describe('Parameter', () => {
  const expectDirtyStateChange = (edit) => {
    cy.getByTestId('ParameterName-test-parameter')
      .find('.parameter-input')
      .should(($el) => {
        assert.isUndefined($el.data('dirty'));
      });

    edit();

    cy.getByTestId('ParameterName-test-parameter')
      .find('.parameter-input')
      .should(($el) => {
        assert.isTrue($el.data('dirty'));
      });
  };

  beforeEach(() => {
    cy.login();
  });

  describe('Text Parameter', () => {
    beforeEach(() => {
      const queryData = {
        name: 'Text Parameter',
        query: "SELECT '{{test-parameter}}' AS parameter",
      };

      createQuery(queryData, false)
        .then(({ id }) => cy.visit(`/queries/${id}`));
    });

    it('updates the results after clicking in Apply or pressing enter', () => {
      cy.getByTestId('ParameterName-test-parameter')
        .find('input')
        .type('Redash');

      cy.getByTestId('ParameterApplyButton')
        .click();

      cy.getByTestId('DynamicTable')
        .should('contain', 'Redash');

      cy.getByTestId('ParameterName-test-parameter')
        .find('input')
        .type('{selectall}New value{enter}');

      cy.getByTestId('DynamicTable')
        .should('contain', 'New value');
    });

    it('sets dirty state when edited', () => {
      expectDirtyStateChange(() => {
        cy.getByTestId('ParameterName-test-parameter')
          .find('input')
          .type('Redash');
      });
    });
  });

  describe('Number Parameter', () => {
    beforeEach(() => {
      const queryData = {
        name: 'Number Parameter',
        query: "SELECT '{{test-parameter}}' AS parameter",
        options: {
          parameters: [
            { name: 'test-parameter', title: 'Test Parameter', type: 'number' },
          ],
        },
      };

      createQuery(queryData, false)
        .then(({ id }) => cy.visit(`/queries/${id}`));
    });

    it('updates the results after clicking in Apply or pressing enter', () => {
      cy.getByTestId('ParameterName-test-parameter')
        .find('input')
        .type('{selectall}42');

      cy.getByTestId('ParameterApplyButton')
        .click();

      cy.getByTestId('DynamicTable')
        .should('contain', 42);

      cy.getByTestId('ParameterName-test-parameter')
        .find('input')
        .type('{selectall}31415{enter}');

      cy.getByTestId('DynamicTable')
        .should('contain', 31415);
    });

    it('sets dirty state when edited', () => {
      expectDirtyStateChange(() => {
        cy.getByTestId('ParameterName-test-parameter')
          .find('input')
          .type('{selectall}42');
      });
    });
  });

  describe('Dropdown Parameter', () => {
    beforeEach(() => {
      const queryData = {
        name: 'Number Parameter',
        query: "SELECT '{{test-parameter}}' AS parameter",
        options: {
          parameters: [
            { name: 'test-parameter',
              title: 'Test Parameter',
              type: 'enum',
              enumOptions: 'value1\nvalue2\nvalue3' },
          ],
        },
      };

      createQuery(queryData, false)
        .then(({ id }) => cy.visit(`/queries/${id}`));
    });

    it('updates the results after selecting a value', () => {
      cy.getByTestId('ParameterName-test-parameter')
        .find('.ant-select')
        .click();

      cy.contains('li.ant-select-dropdown-menu-item', 'value1')
        .click();

      cy.getByTestId('ParameterApplyButton')
        .click();

      cy.getByTestId('DynamicTable')
        .should('contain', 'value1');
    });

    it('sets dirty state when edited', () => {
      expectDirtyStateChange(() => {
        cy.getByTestId('ParameterName-test-parameter')
          .find('.ant-select')
          .click();

        cy.contains('li.ant-select-dropdown-menu-item', 'value1')
          .click();
      });
    });
  });

  describe('Date Parameter', () => {
    beforeEach(() => {
      const queryData = {
        name: 'Date Parameter',
        query: "SELECT '{{test-parameter}}' AS parameter",
      };

      createQuery(queryData, false)
        .then(({ id }) => cy.visit(`/queries/${id}/source`));

      cy.clickThrough(`
        ParameterSettings-test-parameter
        ParameterTypeSelect
        DateParameterTypeOption
        UseCurrentDateTimeCheckbox
        SaveParameterSettings 
      `);

      const now = new Date(2019, 0, 1).getTime(); // January 1, 2019 timestamp
      cy.clock(now);
    });

    afterEach(() => {
      cy.clock().then(clock => clock.restore());
    });

    it('updates the results after selecting a date', () => {
      cy.getByTestId('ParameterName-test-parameter')
        .find('input')
        .click();

      cy.get('.ant-calendar-date-panel')
        .contains('.ant-calendar-date', '15')
        .click();

      cy.getByTestId('ParameterApplyButton')
        .click();

      cy.getByTestId('DynamicTable')
        .should('contain', '15/01/19');
    });

    it('sets dirty state when edited', () => {
      expectDirtyStateChange(() => {
        cy.getByTestId('ParameterName-test-parameter')
          .find('input')
          .click();

        cy.get('.ant-calendar-date-panel')
          .contains('.ant-calendar-date', '15')
          .click();
      });
    });
  });

  describe('Date and Time Parameter', () => {
    beforeEach(() => {
      const queryData = {
        name: 'Date and Time Parameter',
        query: "SELECT '{{test-parameter}}' AS parameter",
      };

      createQuery(queryData, false)
        .then(({ id }) => cy.visit(`/queries/${id}/source`));

      cy.clickThrough(`
        ParameterSettings-test-parameter
        ParameterTypeSelect
        DateTimeParameterTypeOption
        UseCurrentDateTimeCheckbox
        SaveParameterSettings
      `);

      const now = new Date(2019, 0, 1).getTime(); // January 1, 2019 timestamp
      cy.clock(now);
    });

    afterEach(() => {
      cy.clock().then(clock => clock.restore());
    });

    it('updates the results after selecting a date and clicking in ok', () => {
      cy.getByTestId('ParameterName-test-parameter')
        .find('input')
        .click();

      cy.get('.ant-calendar-date-panel')
        .contains('.ant-calendar-date', '15')
        .click();

      cy.get('.ant-calendar-ok-btn')
        .click();

      cy.getByTestId('ParameterApplyButton')
        .click();

      cy.getByTestId('DynamicTable')
        .should('contain', '2019-01-15 00:00');
    });

    it('shows the current datetime after clicking in Now', () => {
      cy.getByTestId('ParameterName-test-parameter')
        .find('input')
        .click();

      cy.get('.ant-calendar-date-panel')
        .contains('Now')
        .click();

      cy.getByTestId('ParameterApplyButton')
        .click();

      cy.getByTestId('DynamicTable')
        .should('contain', '2019-01-01 00:00');
    });

    it('sets dirty state when edited', () => {
      expectDirtyStateChange(() => {
        cy.getByTestId('ParameterName-test-parameter')
          .find('input')
          .click();

        cy.get('.ant-calendar-date-panel')
          .contains('Now')
          .click();
      });
    });
  });

  describe('Apply Button', () => {
    beforeEach(() => {
      const queryData = {
        name: 'Testing Apply Button',
        query: "SELECT '{{test-parameter-1}} {{ test-parameter-2 }}'",
      };

      createQuery(queryData, false)
        .then(({ id }) => cy.visit(`/queries/${id}/source`));

      cy.getByTestId('ParameterApplyButton').as('ApplyButton');
    });

    it('shows and hides according to parameter dirty state', () => {
      cy.get('@ApplyButton')
        .should('not.be', 'visible');

      cy.getByTestId('ParameterName-test-parameter-1')
        .find('input')
        .as('Param')
        .type('Redash');

      cy.get('@ApplyButton')
        .should('be', 'visible');

      cy.get('@Param')
        .clear();

      cy.get('@ApplyButton')
        .should('not.be', 'visible');
    });

    it('updates dirty counter', () => {
      cy.getByTestId('ParameterName-test-parameter-1')
        .find('input')
        .type('Redash');

      cy.get('@ApplyButton')
        .find('.ant-badge-count p.current')
        .should('contain', '1');

      cy.getByTestId('ParameterName-test-parameter-2')
        .find('input')
        .type('Redash');

      cy.get('@ApplyButton')
        .find('.ant-badge-count p.current')
        .should('contain', '2');
    });

    it('applies parameter changes', () => {
      cy.getByTestId('ParameterName-test-parameter-1')
        .find('input')
        .type('Redash');

      cy.getByTestId('ParameterName-test-parameter-2')
        .find('input')
        .type('Redash');

      cy.location('search').should('not.contain', 'Redash');

      // listen to results
      cy.server();
      cy.route('POST', 'api/queries/*/results').as('Results');

      cy.get('@ApplyButton')
        .click();

      cy.location('search').should('contain', 'Redash');
      cy.wait('@Results');
    });
  });
});
