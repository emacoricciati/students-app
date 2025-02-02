import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { faCircle } from '@fortawesome/free-regular-svg-icons';
import { Icon } from '@lib/ui/components/Icon';
import { PillDropdownActivator } from '@lib/ui/components/PillDropdownActivator';
import { Text } from '@lib/ui/components/Text';
import { useStylesheet } from '@lib/ui/hooks/useStylesheet';
import { useTheme } from '@lib/ui/hooks/useTheme';
import { Theme } from '@lib/ui/types/Theme';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { useQueryClient } from '@tanstack/react-query';

import {
  AGENDA_FILTERS_KEY,
  useGetAgendaTypesFilter,
} from '../queries/agendaHooks';
import { ALL_AGENDA_TYPES, AgendaItemType } from '../types/AgendaItem';
import { AgendaTypesFilterState } from '../types/AgendaTypesFilterState';

export const AgendaTypeFilter = () => {
  const { t } = useTranslation();
  const getLocalizedType = useCallback(
    (type: AgendaItemType) => {
      return t(
        `common.` + (type === 'exam' ? 'examCall_plural' : `${type}_plural`),
      );
    },
    [t],
  );

  const { data } = useGetAgendaTypesFilter();
  const queryClient = useQueryClient();
  const toggleFilter = (type: AgendaItemType) =>
    queryClient.setQueryData(AGENDA_FILTERS_KEY, oldF => ({
      ...(oldF ?? {}),
      [type]: !(oldF as AgendaTypesFilterState)[type],
    }));

  const { colors } = useTheme();

  const colorsMap: Record<AgendaItemType, string> = useMemo(() => {
    return {
      booking: colors.agendaBooking,
      deadline: colors.agendaDeadline,
      exam: colors.agendaExam,
      lecture: colors.agendaLecture,
    };
  }, [
    colors.agendaBooking,
    colors.agendaDeadline,
    colors.agendaExam,
    colors.agendaLecture,
  ]);

  const styles = useStylesheet(createStyles);

  // Update the pill content when the state changes
  const pillContent = useMemo(() => {
    if (!data) return null;

    const selectedTypes: AgendaItemType[] = [];
    Object.entries(data).forEach(([type, enabled]) => {
      if (enabled) selectedTypes.push(type as AgendaItemType);
    });

    if (selectedTypes.length === 0 || selectedTypes.length === 4) {
      return <Text>{t('common.all')}</Text>;
    } else {
      return selectedTypes.map(type => (
        <View key={type} style={styles.buttonType}>
          <Icon icon={faCircle} color={colorsMap[type]} />
          <Text>{getLocalizedType(type)}</Text>
        </View>
      ));
    }
  }, [data, colorsMap, getLocalizedType, styles.buttonType, t]);

  const typeActions = useMemo(() => {
    if (!data) return [];

    return ALL_AGENDA_TYPES.map(eventType => {
      const typedEventType = eventType as AgendaItemType;
      const title = getLocalizedType(typedEventType);

      return {
        id: eventType,
        title,
        state: (data[typedEventType] ? 'on' : 'off') as MenuAction['state'],
        imageColor: colorsMap[typedEventType],
        image: Platform.select({
          ios: 'circle',
          android: 'circle',
        }),
      };
    });
  }, [data, colorsMap, getLocalizedType]);

  return (
    <MenuView
      actions={typeActions}
      onPressAction={({ nativeEvent: { event } }) => {
        const type = event as AgendaItemType;
        toggleFilter(type);
      }}
    >
      <PillDropdownActivator variant="neutral">
        <View style={styles.typeFilter}>
          <Text key="events">{t('common.event_plural')}:</Text>
          {pillContent}
        </View>
      </PillDropdownActivator>
    </MenuView>
  );
};

const createStyles = ({ colors, spacing }: Theme) =>
  StyleSheet.create({
    typeFilter: {
      display: 'flex',
      flexDirection: 'row',
      gap: spacing[2],
      alignItems: 'center',
    },
    buttonType: {
      display: 'flex',
      flexDirection: 'row',
      gap: spacing[1],
      alignItems: 'center',
    },
    tabBooking: {
      borderColor: colors.agendaBooking,
    },
    tabDeadline: {
      borderColor: colors.agendaDeadline,
    },
    tabExam: {
      borderColor: colors.agendaExam,
    },
    tabLecture: {
      borderColor: colors.agendaLecture,
    },
  });
