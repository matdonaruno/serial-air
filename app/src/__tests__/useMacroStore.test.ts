import { useMacroStore } from '../stores/useMacroStore';

describe('useMacroStore', () => {
  beforeEach(() => {
    useMacroStore.setState({ macros: [] });
  });

  describe('addMacro', () => {
    it('should add a new macro', () => {
      useMacroStore.getState().addMacro('Reboot', 'AT+RST');

      const macros = useMacroStore.getState().macros;
      expect(macros).toHaveLength(1);
      expect(macros[0].name).toBe('Reboot');
      expect(macros[0].command).toBe('AT+RST');
      expect(macros[0].id).toBeDefined();
    });

    it('should add multiple macros', () => {
      useMacroStore.getState().addMacro('Reboot', 'AT+RST');
      useMacroStore.getState().addMacro('Status', 'status');
      useMacroStore.getState().addMacro('LED On', 'led on');

      expect(useMacroStore.getState().macros).toHaveLength(3);
    });

    it('should generate unique IDs', () => {
      useMacroStore.getState().addMacro('A', 'a');
      useMacroStore.getState().addMacro('B', 'b');

      const macros = useMacroStore.getState().macros;
      expect(macros[0].id).not.toBe(macros[1].id);
    });
  });

  describe('removeMacro', () => {
    it('should remove macro by ID', () => {
      useMacroStore.getState().addMacro('Reboot', 'AT+RST');
      useMacroStore.getState().addMacro('Status', 'status');

      const id = useMacroStore.getState().macros[0].id;
      useMacroStore.getState().removeMacro(id);

      const macros = useMacroStore.getState().macros;
      expect(macros).toHaveLength(1);
      expect(macros[0].name).toBe('Status');
    });

    it('should not affect other macros', () => {
      useMacroStore.getState().addMacro('A', 'a');
      useMacroStore.getState().addMacro('B', 'b');
      useMacroStore.getState().addMacro('C', 'c');

      const id = useMacroStore.getState().macros[1].id;
      useMacroStore.getState().removeMacro(id);

      const names = useMacroStore.getState().macros.map((m) => m.name);
      expect(names).toEqual(['A', 'C']);
    });
  });

  describe('reorderMacros', () => {
    it('should replace macros with new order', () => {
      useMacroStore.getState().addMacro('A', 'a');
      useMacroStore.getState().addMacro('B', 'b');
      useMacroStore.getState().addMacro('C', 'c');

      const macros = useMacroStore.getState().macros;
      const reversed = [...macros].reverse();
      useMacroStore.getState().reorderMacros(reversed);

      const names = useMacroStore.getState().macros.map((m) => m.name);
      expect(names).toEqual(['C', 'B', 'A']);
    });
  });
});
