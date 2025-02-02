import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View, useWindowDimensions } from 'react-native';

import { faSliders } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from '@lib/ui/components/IconButton';
import { Text } from '@lib/ui/components/Text';
import { TopTabBar } from '@lib/ui/components/TopTabBar';
import { useTheme } from '@lib/ui/hooks/useTheme';
import {
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { usePushNotifications } from '../../../core/hooks/usePushNotifications';
import { useTitlesStyles } from '../../../core/hooks/useTitlesStyles';
import { useGetCourses } from '../../../core/queries/courseHooks';
import { CourseContext } from '../contexts/CourseContext';
import { FilesCacheProvider } from '../providers/FilesCacheProvider';
import { CourseAssignmentsScreen } from '../screens/CourseAssignmentsScreen';
import { CourseFilesScreen } from '../screens/CourseFilesScreen';
import { CourseInfoScreen } from '../screens/CourseInfoScreen';
import { CourseLecturesScreen } from '../screens/CourseLecturesScreen';
import { CourseNoticesScreen } from '../screens/CourseNoticesScreen';
import { CourseIndicator } from './CourseIndicator';
import { TeachingStackParamList } from './TeachingNavigator';

type Props = NativeStackScreenProps<TeachingStackParamList, 'Course'>;

export interface CourseTabsParamList extends TeachingStackParamList {
  CourseInfoScreen: undefined;
  CourseNoticesScreen: undefined;
  CourseFilesScreen: undefined;
  CourseLecturesScreen: undefined;
  CourseAssignmentsScreen: undefined;
}

const TopTabs = createMaterialTopTabNavigator<CourseTabsParamList>();

export const CourseNavigator = ({ route, navigation }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { palettes, fontSizes, spacing } = theme;
  const { width } = useWindowDimensions();
  const { getUnreadsCount } = usePushNotifications();
  const titleStyles = useTitlesStyles(theme);

  const { id } = route.params;

  const coursesQuery = useGetCourses();

  useEffect(() => {
    if (!coursesQuery.data) return;
    const course = coursesQuery.data.find(c => c.id === id);
    if (!course) return;
    navigation.setOptions({
      headerTitle: () => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            left: Platform.select({ android: -20 }),
          }}
        >
          <CourseIndicator uniqueShortcode={course.uniqueShortcode} />
          <Text
            variant="title"
            style={[
              {
                marginLeft: spacing[2],
                maxWidth: width - 180,
              },
              titleStyles.headerTitleStyle,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {course.name}
          </Text>
        </View>
      ),
      headerRight: () => (
        <IconButton
          icon={faSliders}
          color={palettes.primary[400]}
          size={fontSizes.lg}
          accessibilityRole="button"
          accessibilityLabel={t('common.preferences')}
          hitSlop={{
            left: +spacing[3],
            right: +spacing[3],
          }}
          onPress={() => {
            navigation.navigate('CoursePreferences', {
              courseId: id,
              uniqueShortcode: course.uniqueShortcode,
            });
          }}
        />
      ),
    });
  }, [
    coursesQuery.data,
    fontSizes.lg,
    id,
    navigation,
    palettes.primary,
    spacing,
    t,
    titleStyles.headerTitleStyle,
    width,
  ]);

  return (
    <CourseContext.Provider value={id}>
      <FilesCacheProvider>
        <TopTabs.Navigator tabBar={props => <TopTabBar {...props} />}>
          <TopTabs.Screen
            name="CourseInfoScreen"
            component={CourseInfoScreen}
            options={{
              title: t('courseInfoTab.title'),
            }}
          />
          <TopTabs.Screen
            name="CourseNoticesScreen"
            component={CourseNoticesScreen}
            options={{
              title: t('courseNoticesTab.title'),
              tabBarBadge: getUnreadsCount([
                'teaching',
                'courses',
                id.toString(),
                'notices',
              ]) as unknown as MaterialTopTabNavigationOptions['tabBarBadge'],
            }}
          />
          <TopTabs.Screen
            name="CourseFilesScreen"
            component={CourseFilesScreen}
            options={{
              title: t('courseFilesTab.title'),
              tabBarBadge: getUnreadsCount([
                'teaching',
                'courses',
                id.toString(),
                'files',
              ]) as unknown as MaterialTopTabNavigationOptions['tabBarBadge'],
            }}
          />
          <TopTabs.Screen
            name="CourseLecturesScreen"
            component={CourseLecturesScreen}
            options={{
              title: t('courseLecturesTab.title'),
            }}
          />
          <TopTabs.Screen
            name="CourseAssignmentsScreen"
            component={CourseAssignmentsScreen}
            options={{
              title: t('courseAssignmentsTab.title'),
            }}
          />
        </TopTabs.Navigator>
      </FilesCacheProvider>
    </CourseContext.Provider>
  );
};
