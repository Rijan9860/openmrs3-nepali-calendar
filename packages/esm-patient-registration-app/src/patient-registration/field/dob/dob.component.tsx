import React, { useEffect, useContext } from 'react';
import { ContentSwitcher, Switch, TextInput, Layer } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useField } from 'formik';
import { generateFormatting } from '../../date-util';
import { PatientRegistrationContext } from '../../patient-registration-context';
import styles from '../field.scss';
import { useConfig } from '@openmrs/esm-framework';
import { RegistrationConfig } from '../../../config-schema';

const loadScript = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

const loadStylesheet = (href: string) => {
  return new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
};

const calcBirthdate = (yearDelta: number, monthDelta: number, dateOfBirth: any) => {
  const { enabled, month, dayOfMonth } = dateOfBirth.useEstimatedDateOfBirth;
  const startDate = new Date();
  const resultMonth = new Date(startDate.getFullYear() - yearDelta, startDate.getMonth() - monthDelta, 1);
  const resultDate = new Date(resultMonth.getFullYear(), resultMonth.getMonth(), 1);
  return enabled ? new Date(resultDate.getFullYear(), month, dayOfMonth) : resultDate;
};

export const DobField: React.FC = () => {
  const { t } = useTranslation();
  const {
    fieldConfigurations: { dateOfBirth },
  } = useConfig() as RegistrationConfig;
  const [dobUnknown] = useField('birthdateEstimated');
  const dobKnown = !dobUnknown.value;
  const [birthdate, birthdateMeta] = useField('birthdate');
  const [yearsEstimated, yearsEstimateMeta] = useField('yearsEstimated');
  const [monthsEstimated, monthsEstimateMeta] = useField('monthsEstimated');
  const { setFieldValue } = useContext(PatientRegistrationContext);
  const { format, placeHolder, dateFormat } = generateFormatting(['d', 'm', 'Y'], '/');
  const today = new Date();

  useEffect(() => {
    const loadDatePicker = async () => {
      try {
        await loadStylesheet('https://unpkg.com/nepali-date-picker@2.0.2/dist/nepaliDatePicker.min.css');
        await loadScript('https://code.jquery.com/jquery-3.7.1.min.js');
        await loadScript('https://unpkg.com/nepali-date-picker@2.0.2/dist/nepaliDatePicker.min.js');
        const mainInput = document.querySelector('.bod-picker');
        if (mainInput) {
          const $mainInput = $(mainInput) as any;
          if (typeof $mainInput.nepaliDatePicker === 'function') {
            $mainInput.nepaliDatePicker({
              dateFormat: "%D, %M %d, %y",
              closeOnDateSelect: true,
              onChange: (event: any) => {
                setFieldValue('birthdate', event.target.value);
              },
            });
          }
        }

        console.log("Nepali Date Time")
        
        document.getElementById('clear-bth')?.addEventListener('click', () => {
          $('.bod-picker').val('');
          setFieldValue('birthdate', '');
        });
      } catch (error) {
        console.error('Failed to load Nepali DatePicker', error);
      }
    };

    if (dobKnown) {
      loadDatePicker();
    }
  }, [dobKnown, setFieldValue]);

  const onToggle = (e: any) => {
    setFieldValue('birthdateEstimated', e.name === 'unknown');
    setFieldValue('birthdate', '');
    setFieldValue('yearsEstimated', 0);
    setFieldValue('monthsEstimated', '');
  };

  const onDateChange = (date: any) => {
    setFieldValue('birthdate', date);
  };

  const onEstimatedYearsChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const years = +ev.target.value;
    if (!isNaN(years) && years < 140 && years >= 0) {
      setFieldValue('yearsEstimated', years);
      setFieldValue('birthdate', calcBirthdate(years, monthsEstimateMeta.value, dateOfBirth));
    }
  };

  const onEstimatedMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const months = +e.target.value;
    if (!isNaN(months)) {
      setFieldValue('monthsEstimated', months);
      setFieldValue('birthdate', calcBirthdate(yearsEstimateMeta.value, months, dateOfBirth));
    }
  };

  const updateBirthdate = () => {
    const months = +monthsEstimateMeta.value % 12;
    const years = +yearsEstimateMeta.value + Math.floor(monthsEstimateMeta.value / 12);
    setFieldValue('yearsEstimated', years);
    setFieldValue('monthsEstimated', months > 0 ? months : '');
    setFieldValue('birthdate', calcBirthdate(years, months, dateOfBirth));
  };

  return (
    <div className={styles.halfWidthInDesktopView}>
      <h4 className={styles.productiveHeading02Light}>{t('birthFieldLabelText', 'Birth')}</h4>
      <div className={styles.dobField}>
        <div className={styles.dobContentSwitcherLabel}>
          <span className={styles.label01}>{t('dobToggleLabelText', 'Date of Birth Known?')}</span>
        </div>
        <ContentSwitcher onChange={onToggle}>
          <Switch name="known" text={t('yes', 'Yes')} />
          <Switch name="unknown" text={t('no', 'No')} />
        </ContentSwitcher>
      </div>
      <Layer>
        {dobKnown ? (
          <div className={styles.dobField}>
            <input type="text" className="bod-picker" placeholder="Select Date of Birth" />
            <button id="clear-bth" type="button">{t('clear', 'Clear')}</button>
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.dobField}>
              <TextInput
                id="yearsEstimated"
                type="number"
                name={yearsEstimated.name}
                light
                onChange={onEstimatedYearsChange}
                labelText={t('estimatedAgeInYearsLabelText', 'Estimated age in years')}
                invalid={!!(yearsEstimateMeta.touched && yearsEstimateMeta.error)}
                invalidText={yearsEstimateMeta.error && t(yearsEstimateMeta.error)}
                value={yearsEstimated.value}
                min={0}
                required
                {...yearsEstimated}
                onBlur={updateBirthdate}
              />
            </div>
            <div className={styles.dobField}>
              <TextInput
                id="monthsEstimated"
                type="number"
                name={monthsEstimated.name}
                light
                onChange={onEstimatedMonthsChange}
                labelText={t('estimatedAgeInMonthsLabelText', 'Estimated age in months')}
                invalid={!!(monthsEstimateMeta.touched && monthsEstimateMeta.error)}
                invalidText={monthsEstimateMeta.error && t(monthsEstimateMeta.error)}
                value={monthsEstimated.value}
                min={0}
                {...monthsEstimated}
                required={!yearsEstimateMeta.value}
                onBlur={updateBirthdate}
              />
            </div>
          </div>
        )}
      </Layer>
    </div>
  );
};
