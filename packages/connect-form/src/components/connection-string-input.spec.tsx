import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';

import ConnectionStringInput, {
  hidePasswordInConnectionString,
} from './connection-string-input';

describe('ConnectionStringInput Component', function () {
  let setConnectionStringErrorSpy: sinon.SinonSpy;
  let setConnectionStringUrlSpy: sinon.SinonSpy;

  beforeEach(function () {
    setConnectionStringErrorSpy = sinon.spy();
    setConnectionStringUrlSpy = sinon.spy();
  });
  afterEach(cleanup);

  describe('#hidePasswordInConnectionString', function () {
    it('returns the connection string when it cannot be parsed', function () {
      const result = hidePasswordInConnectionString('pineapples');
      expect(result).to.equal('pineapples');
    });

    it('returns the connection string when there is no password', function () {
      const result = hidePasswordInConnectionString(
        'mongodb://localhost:27017'
      );
      expect(result).to.equal('mongodb://localhost:27017/');
    });

    it('returns the connection string with password hidden', function () {
      const result = hidePasswordInConnectionString(
        'mongodb://pineapples:melons@localhost:27017'
      );
      expect(result).to.equal('mongodb://pineapples:*****@localhost:27017/');
    });

    it('returns the connection string with password hidden srv', function () {
      const result = hidePasswordInConnectionString(
        'mongodb+srv://pineapples:melons@localhost'
      );
      expect(result).to.equal('mongodb+srv://pineapples:*****@localhost/');
    });

    it('returns a connection string with search params', function () {
      const result = hidePasswordInConnectionString(
        'mongodb+srv://test:pineapple@test.mongodb.net/test?authSource=admin&replicaSet=test&readPreference=primary&appname=MongoDB+Compass+Dev+Local&ssl=true'
      );
      expect(result).to.equal(
        'mongodb+srv://test:*****@test.mongodb.net/test?authSource=admin&replicaSet=test&readPreference=primary&appname=MongoDB+Compass+Dev+Local&ssl=true'
      );
    });
  });

  describe('with an empty connection string', function () {
    beforeEach(function () {
      render(
        <ConnectionStringInput
          connectionString=""
          setConnectionStringError={setConnectionStringErrorSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('should show the connection string in the text area', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.have.text('');
    });

    it('should show the connection string input not disabled', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.not.match('[disabled]');
    });

    describe('when an invalid connection string is inputted', function () {
      beforeEach(function () {
        // Focus the input.
        userEvent.tab();
        userEvent.tab();
        userEvent.tab();
        userEvent.keyboard('z');
      });

      it('should call setConnectionStringError', function () {
        expect(setConnectionStringErrorSpy.callCount).to.equal(1);
        expect(setConnectionStringErrorSpy.firstCall.args[0]).to.equal(
          'Invalid schema, expected connection string to start with `mongodb://` or `mongodb+srv://`'
        );
      });

      it('should not call setConnectionStringUrl', function () {
        expect(setConnectionStringUrlSpy.callCount).to.equal(0);
      });
    });

    describe('when a valid connection string is inputted', function () {
      beforeEach(function () {
        // Focus the input.
        userEvent.tab();
        userEvent.tab();
        userEvent.tab();
        userEvent.keyboard('mongodb://localhost');
      });

      it('should call setConnectionStringUrl with the connection string', function () {
        expect(setConnectionStringUrlSpy.callCount).to.equal(9);
        expect(setConnectionStringUrlSpy.lastCall.args[0].toString()).to.equal(
          'mongodb://localhost/'
        );
      });
    });
  });

  describe('the info button', function () {
    beforeEach(function () {
      render(
        <ConnectionStringInput
          connectionString="mongodb+srv://turtles:pineapples@localhost/"
          setConnectionStringError={setConnectionStringErrorSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('has a link to docs', function () {
      const button = screen.getByTestId('connectionStringDocsButton');
      expect(button.getAttribute('href')).to.equal(
        'https://docs.mongodb.com/manual/reference/connection-string/'
      );
    });

    it('has a link role', function () {
      const button = screen.getByRole('link');
      expect(button.getAttribute('href')).to.equal(
        'https://docs.mongodb.com/manual/reference/connection-string/'
      );
    });
  });

  describe('with a connection string', function () {
    beforeEach(function () {
      render(
        <ConnectionStringInput
          connectionString="mongodb+srv://turtles:pineapples@localhost/"
          setConnectionStringError={setConnectionStringErrorSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('shows the connection string in the text area', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.have.text('mongodb+srv://turtles:*****@localhost/');
    });

    it('should show the connection string input disabled', function () {
      const textArea = screen.getByRole('textbox');
      expect(textArea).to.match('[disabled]');
    });

    describe('clicking confirm to edit', function () {
      beforeEach(async function () {
        screen.getByRole('switch').click();

        // Click confirm on the modal that opens.
        const confirmButton = screen.getByText('Confirm').closest('button');
        fireEvent(
          confirmButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );

        // Wait for the modal to close.
        await waitFor(() => expect(screen.queryByText('Confirm')).to.not.exist);
      });

      it('should remove the disabled after clicking confirm to edit', function () {
        const textArea = screen.getByRole('textbox');
        expect(textArea).to.not.match('[disabled]');
      });

      it('should show the uncensored connection string', function () {
        const textArea = screen.getByRole('textbox');
        expect(textArea).to.have.text(
          'mongodb+srv://turtles:pineapples@localhost/'
        );
      });

      describe('when a valid connection string is inputted', function () {
        beforeEach(function () {
          // Focus the input.
          userEvent.tab();
          userEvent.tab();
          userEvent.tab();
          userEvent.keyboard('?ssl=true');
        });

        it('should call setConnectionStringUrl with the new connection string', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(9);
          expect(
            setConnectionStringUrlSpy.lastCall.args[0].toString()
          ).to.equal('mongodb+srv://turtles:pineapples@localhost/?ssl=true');
        });

        it('should not call setConnectionStringError', function () {
          expect(setConnectionStringErrorSpy.callCount).to.equal(0);
        });
      });

      describe('clicking on edit connection string toggle again', function () {
        beforeEach(function () {
          // Wait for the modal to close.
          const toggle = screen.getByRole('switch');
          toggle.click();
        });

        it('should add disabled on the textbox', function () {
          const textArea = screen.getByRole('textbox');
          expect(textArea).to.match('[disabled]');
        });

        it('should show the censored connection string', function () {
          const textArea = screen.getByRole('textbox');
          expect(textArea).to.have.text(
            'mongodb+srv://turtles:*****@localhost/'
          );
        });
      });
    });

    describe('clicking cancel on confirmation to edit', function () {
      beforeEach(function () {
        screen.getByRole('switch').click();

        // Click cancel on the modal that opens.
        const cancelButton = screen.getByText('Cancel').closest('button');
        fireEvent(
          cancelButton,
          new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          })
        );
      });

      it('should keep the disabled on the textbox', function () {
        const textArea = screen.getByRole('textbox');
        expect(textArea).to.match('[disabled]');
      });

      it('should show the censored connection string', function () {
        const textArea = screen.getByRole('textbox');
        expect(textArea).to.have.text('mongodb+srv://turtles:*****@localhost/');
      });
    });
  });
});
