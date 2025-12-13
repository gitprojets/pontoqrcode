CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'professor',
    'diretor',
    'administrador',
    'desenvolvedor',
    'coordenador',
    'secretario',
    'outro'
);


--
-- Name: admin_create_user(text, text, text, public.app_role, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_create_user(_email text, _password text, _nome text, _role public.app_role DEFAULT 'professor'::public.app_role, _unidade_id uuid DEFAULT NULL::uuid, _matricula text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if caller has admin or developer role
  IF NOT (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'desenvolvedor')) THEN
    RAISE EXCEPTION 'Apenas administradores e desenvolvedores podem criar usuários';
  END IF;

  -- Create user in auth.users via admin API (this will trigger handle_new_user)
  -- For now, we'll just create the profile and role
  -- The actual auth user creation should be done via Supabase Admin API
  
  new_user_id := gen_random_uuid();
  
  -- Insert profile
  INSERT INTO public.profiles (id, nome, email, matricula, unidade_id)
  VALUES (new_user_id, _nome, _email, _matricula, _unidade_id);
  
  -- Delete default role and insert correct role
  DELETE FROM public.user_roles WHERE user_id = new_user_id;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, _role);
  
  RETURN new_user_id;
END;
$$;


--
-- Name: cleanup_expired_nonces(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_nonces() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  DELETE FROM public.qr_nonces WHERE expires_at < now();
$$;


--
-- Name: get_dispositivo_api_key(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dispositivo_api_key(dispositivo_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT api_key 
  FROM public.dispositivos 
  WHERE id = dispositivo_id
    AND (has_role(auth.uid(), 'administrador') OR has_role(auth.uid(), 'desenvolvedor'))
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'administrador' THEN 1 
      WHEN 'diretor' THEN 2 
      WHEN 'professor' THEN 3 
    END
  LIMIT 1
$$;


--
-- Name: get_user_unit_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_unit_id(user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT unidade_id FROM profiles WHERE id = user_id;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email
  );
  
  -- Default role is professor
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'professor');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: dispositivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dispositivos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    unidade_id uuid,
    local text,
    status text DEFAULT 'offline'::text NOT NULL,
    ultima_leitura timestamp with time zone,
    leituras_hoje integer DEFAULT 0 NOT NULL,
    api_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dispositivos_status_check CHECK ((status = ANY (ARRAY['online'::text, 'offline'::text, 'erro'::text])))
);


--
-- Name: dispositivos_safe; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.dispositivos_safe WITH (security_invoker='true') AS
 SELECT id,
    nome,
    unidade_id,
    local,
    status,
    ultima_leitura,
    leituras_hoje,
    created_at,
    updated_at
   FROM public.dispositivos;


--
-- Name: escalas_trabalho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.escalas_trabalho (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professor_id uuid NOT NULL,
    unidade_id uuid NOT NULL,
    semana_inicio date NOT NULL,
    dia_semana integer NOT NULL,
    hora_entrada time without time zone,
    hora_saida time without time zone,
    is_folga boolean DEFAULT false NOT NULL,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT escalas_trabalho_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    matricula text,
    unidade text,
    foto text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    unidade_id uuid
);


--
-- Name: qr_nonces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qr_nonces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nonce text NOT NULL,
    professor_id uuid NOT NULL,
    used_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: registros_frequencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_frequencia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    professor_id uuid NOT NULL,
    unidade_id uuid NOT NULL,
    dispositivo_id uuid,
    data_registro date DEFAULT CURRENT_DATE NOT NULL,
    hora_entrada time without time zone,
    hora_saida time without time zone,
    status text DEFAULT 'presente'::text NOT NULL,
    lido_por uuid,
    observacao text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT registros_frequencia_status_check CHECK ((status = ANY (ARRAY['presente'::text, 'atrasado'::text, 'falta'::text, 'justificado'::text, 'folga'::text])))
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'aberto'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    response text,
    responded_by uuid,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: unidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    endereco text,
    telefone text,
    diretor_id uuid,
    status text DEFAULT 'online'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    hora_abertura time without time zone DEFAULT '07:00:00'::time without time zone,
    hora_fechamento time without time zone DEFAULT '17:00:00'::time without time zone,
    dias_funcionamento integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    CONSTRAINT unidades_status_check CHECK ((status = ANY (ARRAY['online'::text, 'offline'::text, 'manutencao'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: dispositivos dispositivos_api_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_api_key_key UNIQUE (api_key);


--
-- Name: dispositivos dispositivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_pkey PRIMARY KEY (id);


--
-- Name: escalas_trabalho escalas_trabalho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalas_trabalho
    ADD CONSTRAINT escalas_trabalho_pkey PRIMARY KEY (id);


--
-- Name: escalas_trabalho escalas_trabalho_professor_id_semana_inicio_dia_semana_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalas_trabalho
    ADD CONSTRAINT escalas_trabalho_professor_id_semana_inicio_dia_semana_key UNIQUE (professor_id, semana_inicio, dia_semana);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: qr_nonces qr_nonces_nonce_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_nonces
    ADD CONSTRAINT qr_nonces_nonce_key UNIQUE (nonce);


--
-- Name: qr_nonces qr_nonces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_nonces
    ADD CONSTRAINT qr_nonces_pkey PRIMARY KEY (id);


--
-- Name: registros_frequencia registros_frequencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_frequencia
    ADD CONSTRAINT registros_frequencia_pkey PRIMARY KEY (id);


--
-- Name: registros_frequencia registros_frequencia_professor_id_data_registro_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_frequencia
    ADD CONSTRAINT registros_frequencia_professor_id_data_registro_key UNIQUE (professor_id, data_registro);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: unidades unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_roles user_roles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);


--
-- Name: idx_dispositivos_unidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dispositivos_unidade_id ON public.dispositivos USING btree (unidade_id);


--
-- Name: idx_escalas_trabalho_professor_semana; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escalas_trabalho_professor_semana ON public.escalas_trabalho USING btree (professor_id, semana_inicio);


--
-- Name: idx_escalas_trabalho_unidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_escalas_trabalho_unidade_id ON public.escalas_trabalho USING btree (unidade_id);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_unidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_unidade_id ON public.profiles USING btree (unidade_id);


--
-- Name: idx_qr_nonces_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_nonces_expires_at ON public.qr_nonces USING btree (expires_at);


--
-- Name: idx_qr_nonces_nonce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_nonces_nonce ON public.qr_nonces USING btree (nonce);


--
-- Name: idx_registros_frequencia_data_registro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registros_frequencia_data_registro ON public.registros_frequencia USING btree (data_registro);


--
-- Name: idx_registros_frequencia_professor_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registros_frequencia_professor_date ON public.registros_frequencia USING btree (professor_id, data_registro);


--
-- Name: idx_registros_frequencia_unidade_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registros_frequencia_unidade_date ON public.registros_frequencia USING btree (unidade_id, data_registro);


--
-- Name: idx_registros_frequencia_unidade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registros_frequencia_unidade_id ON public.registros_frequencia USING btree (unidade_id);


--
-- Name: idx_support_tickets_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_created_at ON public.support_tickets USING btree (created_at DESC);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- Name: idx_unidades_diretor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unidades_diretor_id ON public.unidades USING btree (diretor_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: dispositivos update_dispositivos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dispositivos_updated_at BEFORE UPDATE ON public.dispositivos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: escalas_trabalho update_escalas_trabalho_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_escalas_trabalho_updated_at BEFORE UPDATE ON public.escalas_trabalho FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: registros_frequencia update_registros_frequencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_registros_frequencia_updated_at BEFORE UPDATE ON public.registros_frequencia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: support_tickets update_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: unidades update_unidades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dispositivos dispositivos_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dispositivos
    ADD CONSTRAINT dispositivos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.unidades(id) ON DELETE CASCADE;


--
-- Name: escalas_trabalho escalas_trabalho_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalas_trabalho
    ADD CONSTRAINT escalas_trabalho_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: escalas_trabalho escalas_trabalho_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalas_trabalho
    ADD CONSTRAINT escalas_trabalho_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: escalas_trabalho escalas_trabalho_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.escalas_trabalho
    ADD CONSTRAINT escalas_trabalho_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.unidades(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.unidades(id);


--
-- Name: qr_nonces qr_nonces_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_nonces
    ADD CONSTRAINT qr_nonces_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: registros_frequencia registros_frequencia_dispositivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_frequencia
    ADD CONSTRAINT registros_frequencia_dispositivo_id_fkey FOREIGN KEY (dispositivo_id) REFERENCES public.dispositivos(id);


--
-- Name: registros_frequencia registros_frequencia_lido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_frequencia
    ADD CONSTRAINT registros_frequencia_lido_por_fkey FOREIGN KEY (lido_por) REFERENCES public.profiles(id);


--
-- Name: registros_frequencia registros_frequencia_professor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_frequencia
    ADD CONSTRAINT registros_frequencia_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: registros_frequencia registros_frequencia_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_frequencia
    ADD CONSTRAINT registros_frequencia_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.unidades(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.profiles(id);


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: unidades unidades_diretor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_diretor_id_fkey FOREIGN KEY (diretor_id) REFERENCES public.profiles(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles Admins can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'administrador'::public.app_role) OR (auth.uid() = id)));


--
-- Name: dispositivos Admins can manage all dispositivos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all dispositivos" ON public.dispositivos TO authenticated USING (public.has_role(auth.uid(), 'administrador'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: escalas_trabalho Admins can manage all escalas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all escalas" ON public.escalas_trabalho USING (public.has_role(auth.uid(), 'administrador'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: qr_nonces Admins can manage all nonces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all nonces" ON public.qr_nonces USING (public.has_role(auth.uid(), 'administrador'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: registros_frequencia Admins can manage all registros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all registros" ON public.registros_frequencia USING (public.has_role(auth.uid(), 'administrador'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: unidades Admins can manage all unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all unidades" ON public.unidades TO authenticated USING (public.has_role(auth.uid(), 'administrador'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: support_tickets Admins can update tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE USING (public.has_role(auth.uid(), 'administrador'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: support_tickets Admins can view all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (public.has_role(auth.uid(), 'administrador'::public.app_role));


--
-- Name: support_tickets Coordinators can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coordinators can create their own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'coordenador'::public.app_role) AND (auth.uid() = user_id)));


--
-- Name: escalas_trabalho Coordinators can manage escalas in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coordinators can manage escalas in their unit" ON public.escalas_trabalho TO authenticated USING ((public.has_role(auth.uid(), 'coordenador'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid())))) WITH CHECK ((public.has_role(auth.uid(), 'coordenador'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid()))));


--
-- Name: registros_frequencia Coordinators can manage registros in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coordinators can manage registros in their unit" ON public.registros_frequencia TO authenticated USING ((public.has_role(auth.uid(), 'coordenador'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid())))) WITH CHECK ((public.has_role(auth.uid(), 'coordenador'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid()))));


--
-- Name: profiles Coordinators can view profiles in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coordinators can view profiles in their unit" ON public.profiles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'coordenador'::public.app_role) AND ((unidade_id = public.get_user_unit_id(auth.uid())) OR (id = auth.uid()))));


--
-- Name: support_tickets Coordinators can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coordinators can view their own tickets" ON public.support_tickets FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'coordenador'::public.app_role) AND (auth.uid() = user_id)));


--
-- Name: unidades Coordinators can view their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coordinators can view their unit" ON public.unidades FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'coordenador'::public.app_role) AND (id = public.get_user_unit_id(auth.uid()))));


--
-- Name: profiles Developers can delete profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: support_tickets Developers can delete tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can delete tickets" ON public.support_tickets FOR DELETE USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: profiles Developers can insert profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: dispositivos Developers can manage all dispositivos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can manage all dispositivos" ON public.dispositivos TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: escalas_trabalho Developers can manage all escalas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can manage all escalas" ON public.escalas_trabalho USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: qr_nonces Developers can manage all nonces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can manage all nonces" ON public.qr_nonces USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: registros_frequencia Developers can manage all registros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can manage all registros" ON public.registros_frequencia USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: user_roles Developers can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: support_tickets Developers can manage all tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can manage all tickets" ON public.support_tickets USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: unidades Developers can manage all unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can manage all unidades" ON public.unidades TO authenticated USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: profiles Developers can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: profiles Developers can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Developers can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'desenvolvedor'::public.app_role));


--
-- Name: escalas_trabalho Directors can manage escalas in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Directors can manage escalas in their unit" ON public.escalas_trabalho USING ((public.has_role(auth.uid(), 'diretor'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid())))) WITH CHECK ((public.has_role(auth.uid(), 'diretor'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid()))));


--
-- Name: qr_nonces Directors can manage nonces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Directors can manage nonces" ON public.qr_nonces USING (public.has_role(auth.uid(), 'diretor'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'diretor'::public.app_role));


--
-- Name: registros_frequencia Directors can manage registros in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Directors can manage registros in their unit" ON public.registros_frequencia USING ((public.has_role(auth.uid(), 'diretor'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid())))) WITH CHECK ((public.has_role(auth.uid(), 'diretor'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid()))));


--
-- Name: dispositivos Directors can view dispositivos in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Directors can view dispositivos in their unit" ON public.dispositivos FOR SELECT USING ((public.has_role(auth.uid(), 'diretor'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid()))));


--
-- Name: profiles Directors can view profiles in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Directors can view profiles in their unit" ON public.profiles FOR SELECT USING ((public.has_role(auth.uid(), 'diretor'::public.app_role) AND ((unidade_id = public.get_user_unit_id(auth.uid())) OR (unidade_id IS NULL) OR (id = auth.uid()))));


--
-- Name: unidades Directors can view their assigned unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Directors can view their assigned unit" ON public.unidades FOR SELECT USING ((public.has_role(auth.uid(), 'diretor'::public.app_role) AND ((id = public.get_user_unit_id(auth.uid())) OR (diretor_id = auth.uid()))));


--
-- Name: support_tickets Other users can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Other users can create their own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'outro'::public.app_role) AND (auth.uid() = user_id)));


--
-- Name: profiles Other users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Other users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'outro'::public.app_role) AND (id = auth.uid())));


--
-- Name: support_tickets Other users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Other users can view their own tickets" ON public.support_tickets FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'outro'::public.app_role) AND (auth.uid() = user_id)));


--
-- Name: qr_nonces Professors can create their own nonces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can create their own nonces" ON public.qr_nonces FOR INSERT WITH CHECK ((auth.uid() = professor_id));


--
-- Name: escalas_trabalho Professors can view their own escalas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can view their own escalas" ON public.escalas_trabalho FOR SELECT USING ((public.has_role(auth.uid(), 'professor'::public.app_role) AND (professor_id = auth.uid())));


--
-- Name: registros_frequencia Professors can view their own registros; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can view their own registros" ON public.registros_frequencia FOR SELECT USING ((public.has_role(auth.uid(), 'professor'::public.app_role) AND (professor_id = auth.uid())));


--
-- Name: unidades Professors can view unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can view unidades" ON public.unidades FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'professor'::public.app_role));


--
-- Name: dispositivos Require authentication for dispositivos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for dispositivos" ON public.dispositivos TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: escalas_trabalho Require authentication for escalas_trabalho; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for escalas_trabalho" ON public.escalas_trabalho USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: profiles Require authentication for profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for profiles" ON public.profiles TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: qr_nonces Require authentication for qr_nonces; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for qr_nonces" ON public.qr_nonces USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: registros_frequencia Require authentication for registros_frequencia; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for registros_frequencia" ON public.registros_frequencia USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: support_tickets Require authentication for support_tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for support_tickets" ON public.support_tickets USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: unidades Require authentication for unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for unidades" ON public.unidades TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: user_roles Require authentication for user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Require authentication for user_roles" ON public.user_roles TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: support_tickets Secretaries can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Secretaries can create their own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'secretario'::public.app_role) AND (auth.uid() = user_id)));


--
-- Name: profiles Secretaries can view profiles in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Secretaries can view profiles in their unit" ON public.profiles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'secretario'::public.app_role) AND ((unidade_id = public.get_user_unit_id(auth.uid())) OR (id = auth.uid()))));


--
-- Name: registros_frequencia Secretaries can view registros in their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Secretaries can view registros in their unit" ON public.registros_frequencia FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'secretario'::public.app_role) AND (unidade_id = public.get_user_unit_id(auth.uid()))));


--
-- Name: support_tickets Secretaries can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Secretaries can view their own tickets" ON public.support_tickets FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'secretario'::public.app_role) AND (auth.uid() = user_id)));


--
-- Name: unidades Secretaries can view their unit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Secretaries can view their unit" ON public.unidades FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'secretario'::public.app_role) AND (id = public.get_user_unit_id(auth.uid()))));


--
-- Name: support_tickets Users can create their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own tickets" ON public.support_tickets FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: support_tickets Users can view their own tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dispositivos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dispositivos ENABLE ROW LEVEL SECURITY;

--
-- Name: escalas_trabalho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.escalas_trabalho ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: qr_nonces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.qr_nonces ENABLE ROW LEVEL SECURITY;

--
-- Name: registros_frequencia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.registros_frequencia ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: unidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


